/**
 * Orders and Tickets Migration Script
 *
 * Migrates WooCommerce orders and GPS tickets to Supabase.
 *
 * Flow:
 * 1. Export orders from WooCommerce (wp_wc_orders + order meta)
 * 2. Export tickets from wp_gps_tickets
 * 3. Export attendance from wp_gps_attendance
 * 4. Create orders in Supabase
 * 5. Create order items linking to events/seminars
 * 6. Create tickets with QR codes
 * 7. Create attendance records
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-orders.ts [--dry-run] [--since=YYYY-MM-DD]
 */

import {
  supabase,
  getWpConnection,
  closeWpConnection,
  wpTablePrefix,
  migrationSettings,
  log,
  formatWpDate,
  addIdMapping,
  getSupabaseId,
  saveMappingsToFile,
  loadMappingsFromFile,
  createMigrationResult,
  finishMigrationResult,
  saveMigrationReport,
} from './config';
import path from 'path';
import fs from 'fs/promises';

// ============================================================
// TYPES
// ============================================================

interface WcOrder {
  ID: number;
  post_status: string;
  post_date: Date;
  post_modified: Date;
}

interface OrderData {
  wpId: number;
  orderNumber: string;
  userWpId: number | null;
  billingEmail: string;
  billingName: string;
  billingPhone: string | null;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  } | null;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'unpaid' | 'paid' | 'partially_refunded' | 'refunded';
  paymentMethod: string | null;
  transactionId: string | null;
  completedAt: string | null;
  createdAt: string;
  items: OrderItemData[];
}

interface OrderItemData {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemType: 'ticket' | 'seminar';
  eventWpId: number | null;
  seminarWpId: number | null;
  ticketTypeWpId: number | null;
}

interface TicketData {
  wpId: number;
  ticketCode: string;
  ticketTypeWpId: number;
  eventWpId: number;
  userWpId: number;
  orderWpId: number;
  orderItemWpId: number;
  attendeeName: string;
  attendeeEmail: string;
  qrCodePath: string | null;
  status: 'valid' | 'used' | 'cancelled';
  createdAt: string;
}

interface AttendanceData {
  wpId: number;
  ticketWpId: number;
  eventWpId: number;
  userWpId: number;
  checkedInAt: string;
  checkedInByWpId: number | null;
  checkInMethod: 'qr_scan' | 'manual' | 'search';
  notes: string | null;
}

// ============================================================
// FETCH WOOCOMMERCE ORDERS
// ============================================================

async function fetchWcOrders(sinceDate?: string): Promise<OrderData[]> {
  const conn = await getWpConnection();

  log.info('Fetching WooCommerce orders...');

  // Try wp_wc_orders first (HPOS), fall back to wp_posts
  let orders: WcOrder[];
  let usingHPOS = false;

  try {
    const [hposOrders] = await conn.execute<WcOrder[]>(`
      SELECT id as ID, status as post_status, date_created_gmt as post_date, date_updated_gmt as post_modified
      FROM ${wpTablePrefix}wc_orders
      WHERE status IN ('wc-completed', 'wc-processing', 'wc-on-hold', 'wc-cancelled', 'wc-refunded')
      ${sinceDate ? `AND date_created_gmt >= '${sinceDate}'` : ''}
      ORDER BY id ASC
    `);
    orders = hposOrders;
    usingHPOS = true;
    log.info('Using WooCommerce HPOS tables');
  } catch {
    // Fall back to classic posts table
    const [postOrders] = await conn.execute<WcOrder[]>(`
      SELECT ID, post_status, post_date, post_modified
      FROM ${wpTablePrefix}posts
      WHERE post_type = 'shop_order'
      AND post_status IN ('wc-completed', 'wc-processing', 'wc-on-hold', 'wc-cancelled', 'wc-refunded')
      ${sinceDate ? `AND post_date >= '${sinceDate}'` : ''}
      ORDER BY ID ASC
    `);
    orders = postOrders;
    log.info('Using classic WooCommerce posts table');
  }

  log.info(`Found ${orders.length} orders`);

  if (orders.length === 0) return [];

  // Fetch order meta
  const orderIds = orders.map(o => o.ID);
  let orderMeta: Map<number, Record<string, string>> = new Map();

  if (usingHPOS) {
    // HPOS: Get from wc_orders_meta and wc_order_addresses
    const [metaRows] = await conn.execute<{ order_id: number; meta_key: string; meta_value: string }[]>(`
      SELECT order_id, meta_key, meta_value
      FROM ${wpTablePrefix}wc_orders_meta
      WHERE order_id IN (${orderIds.join(',')})
      AND meta_key IN ('_customer_user', '_order_total', '_order_subtotal', '_cart_discount', '_order_currency', '_payment_method', '_transaction_id', '_date_completed')
    `);

    for (const row of metaRows) {
      if (!orderMeta.has(row.order_id)) {
        orderMeta.set(row.order_id, {});
      }
      orderMeta.get(row.order_id)![row.meta_key] = row.meta_value;
    }

    // Get billing addresses
    const [addressRows] = await conn.execute<{
      order_id: number;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
      address_1: string;
      address_2: string;
      city: string;
      state: string;
      postcode: string;
      country: string;
    }[]>(`
      SELECT order_id, email, first_name, last_name, phone, address_1, address_2, city, state, postcode, country
      FROM ${wpTablePrefix}wc_order_addresses
      WHERE order_id IN (${orderIds.join(',')})
      AND address_type = 'billing'
    `);

    for (const row of addressRows) {
      if (!orderMeta.has(row.order_id)) {
        orderMeta.set(row.order_id, {});
      }
      const meta = orderMeta.get(row.order_id)!;
      meta['_billing_email'] = row.email;
      meta['_billing_first_name'] = row.first_name;
      meta['_billing_last_name'] = row.last_name;
      meta['_billing_phone'] = row.phone;
      meta['_billing_address_1'] = row.address_1;
      meta['_billing_address_2'] = row.address_2;
      meta['_billing_city'] = row.city;
      meta['_billing_state'] = row.state;
      meta['_billing_postcode'] = row.postcode;
      meta['_billing_country'] = row.country;
    }
  } else {
    // Classic: Get from postmeta
    const [metaRows] = await conn.execute<{ post_id: number; meta_key: string; meta_value: string }[]>(`
      SELECT post_id, meta_key, meta_value
      FROM ${wpTablePrefix}postmeta
      WHERE post_id IN (${orderIds.join(',')})
      AND meta_key IN (
        '_customer_user', '_order_total', '_order_subtotal', '_cart_discount',
        '_order_currency', '_payment_method', '_transaction_id', '_date_completed',
        '_billing_email', '_billing_first_name', '_billing_last_name', '_billing_phone',
        '_billing_address_1', '_billing_address_2', '_billing_city', '_billing_state',
        '_billing_postcode', '_billing_country'
      )
    `);

    for (const row of metaRows) {
      if (!orderMeta.has(row.post_id)) {
        orderMeta.set(row.post_id, {});
      }
      orderMeta.get(row.post_id)![row.meta_key] = row.meta_value;
    }
  }

  // Fetch order items
  const [itemRows] = await conn.execute<{
    order_item_id: number;
    order_id: number;
    order_item_name: string;
    order_item_type: string;
  }[]>(`
    SELECT order_item_id, order_id, order_item_name, order_item_type
    FROM ${wpTablePrefix}woocommerce_order_items
    WHERE order_id IN (${orderIds.join(',')})
    AND order_item_type = 'line_item'
  `);

  const itemIds = itemRows.map(i => i.order_item_id);
  const itemMetaMap = new Map<number, Record<string, string>>();

  if (itemIds.length > 0) {
    const [itemMetaRows] = await conn.execute<{ order_item_id: number; meta_key: string; meta_value: string }[]>(`
      SELECT order_item_id, meta_key, meta_value
      FROM ${wpTablePrefix}woocommerce_order_itemmeta
      WHERE order_item_id IN (${itemIds.join(',')})
      AND meta_key IN ('_product_id', '_qty', '_line_subtotal', '_line_total', '_gps_event_id', '_gps_seminar_id', '_gps_ticket_type_id')
    `);

    for (const row of itemMetaRows) {
      if (!itemMetaMap.has(row.order_item_id)) {
        itemMetaMap.set(row.order_item_id, {});
      }
      itemMetaMap.get(row.order_item_id)![row.meta_key] = row.meta_value;
    }
  }

  // Group items by order
  const itemsByOrder = new Map<number, typeof itemRows>();
  for (const item of itemRows) {
    if (!itemsByOrder.has(item.order_id)) {
      itemsByOrder.set(item.order_id, []);
    }
    itemsByOrder.get(item.order_id)!.push(item);
  }

  // Transform orders
  const orderData: OrderData[] = orders.map(order => {
    const meta = orderMeta.get(order.ID) || {};
    const items = itemsByOrder.get(order.ID) || [];

    // Map WC status to our status
    let status: OrderData['status'] = 'pending';
    let paymentStatus: OrderData['paymentStatus'] = 'unpaid';
    const wcStatus = order.post_status.replace('wc-', '');

    if (wcStatus === 'completed') {
      status = 'completed';
      paymentStatus = 'paid';
    } else if (wcStatus === 'cancelled') {
      status = 'cancelled';
    } else if (wcStatus === 'refunded') {
      status = 'refunded';
      paymentStatus = 'refunded';
    } else if (wcStatus === 'processing') {
      status = 'completed';
      paymentStatus = 'paid';
    }

    // Build address
    let billingAddress: OrderData['billingAddress'] = null;
    if (meta['_billing_address_1']) {
      billingAddress = {
        line1: meta['_billing_address_1'],
        line2: meta['_billing_address_2'] || undefined,
        city: meta['_billing_city'] || '',
        state: meta['_billing_state'] || '',
        postcode: meta['_billing_postcode'] || '',
        country: meta['_billing_country'] || 'US',
      };
    }

    // Transform items
    const orderItems: OrderItemData[] = items.map(item => {
      const itemMeta = itemMetaMap.get(item.order_item_id) || {};
      const productId = parseInt(itemMeta['_product_id'] || '0');
      const eventId = itemMeta['_gps_event_id'] ? parseInt(itemMeta['_gps_event_id']) : null;
      const seminarId = itemMeta['_gps_seminar_id'] ? parseInt(itemMeta['_gps_seminar_id']) : null;
      const ticketTypeId = itemMeta['_gps_ticket_type_id'] ? parseInt(itemMeta['_gps_ticket_type_id']) : null;

      return {
        productId,
        productName: item.order_item_name,
        quantity: parseInt(itemMeta['_qty'] || '1'),
        unitPrice: parseFloat(itemMeta['_line_subtotal'] || '0'),
        total: parseFloat(itemMeta['_line_total'] || '0'),
        itemType: seminarId ? 'seminar' : 'ticket',
        eventWpId: eventId,
        seminarWpId: seminarId,
        ticketTypeWpId: ticketTypeId,
      };
    });

    return {
      wpId: order.ID,
      orderNumber: `WC-${order.ID}`,
      userWpId: meta['_customer_user'] ? parseInt(meta['_customer_user']) : null,
      billingEmail: meta['_billing_email'] || '',
      billingName: `${meta['_billing_first_name'] || ''} ${meta['_billing_last_name'] || ''}`.trim(),
      billingPhone: meta['_billing_phone'] || null,
      billingAddress,
      subtotal: parseFloat(meta['_order_subtotal'] || '0'),
      discount: parseFloat(meta['_cart_discount'] || '0'),
      total: parseFloat(meta['_order_total'] || '0'),
      currency: meta['_order_currency'] || 'USD',
      status,
      paymentStatus,
      paymentMethod: meta['_payment_method'] || null,
      transactionId: meta['_transaction_id'] || null,
      completedAt: meta['_date_completed'] ? formatWpDate(meta['_date_completed']) : null,
      createdAt: formatWpDate(order.post_date) || new Date().toISOString(),
      items: orderItems,
    };
  });

  return orderData;
}

// ============================================================
// FETCH GPS TICKETS
// ============================================================

async function fetchGpsTickets(): Promise<TicketData[]> {
  const conn = await getWpConnection();

  log.info('Fetching GPS tickets...');

  const [tickets] = await conn.execute<{
    id: number;
    ticket_code: string;
    ticket_type_id: number;
    event_id: number;
    user_id: number;
    order_id: number;
    order_item_id: number;
    attendee_name: string;
    attendee_email: string;
    qr_code_path: string | null;
    status: string;
    created_at: string;
  }[]>(`
    SELECT
      id, ticket_code, ticket_type_id, event_id, user_id,
      order_id, order_item_id, attendee_name, attendee_email,
      qr_code_path, status, created_at
    FROM ${wpTablePrefix}gps_tickets
    ORDER BY id ASC
  `);

  log.info(`Found ${tickets.length} tickets`);

  return tickets.map(ticket => ({
    wpId: ticket.id,
    ticketCode: ticket.ticket_code,
    ticketTypeWpId: ticket.ticket_type_id,
    eventWpId: ticket.event_id,
    userWpId: ticket.user_id,
    orderWpId: ticket.order_id,
    orderItemWpId: ticket.order_item_id,
    attendeeName: ticket.attendee_name,
    attendeeEmail: ticket.attendee_email,
    qrCodePath: ticket.qr_code_path,
    status: (ticket.status || 'valid') as TicketData['status'],
    createdAt: formatWpDate(ticket.created_at) || new Date().toISOString(),
  }));
}

// ============================================================
// FETCH GPS ATTENDANCE
// ============================================================

async function fetchGpsAttendance(): Promise<AttendanceData[]> {
  const conn = await getWpConnection();

  log.info('Fetching GPS attendance...');

  const [attendance] = await conn.execute<{
    id: number;
    ticket_id: number;
    event_id: number;
    user_id: number;
    checked_in_at: string;
    checked_in_by: number | null;
    check_in_method: string;
    notes: string | null;
  }[]>(`
    SELECT
      id, ticket_id, event_id, user_id,
      checked_in_at, checked_in_by, check_in_method, notes
    FROM ${wpTablePrefix}gps_attendance
    ORDER BY id ASC
  `);

  log.info(`Found ${attendance.length} attendance records`);

  return attendance.map(att => ({
    wpId: att.id,
    ticketWpId: att.ticket_id,
    eventWpId: att.event_id,
    userWpId: att.user_id,
    checkedInAt: formatWpDate(att.checked_in_at) || new Date().toISOString(),
    checkedInByWpId: att.checked_in_by,
    checkInMethod: (att.check_in_method || 'manual') as AttendanceData['checkInMethod'],
    notes: att.notes,
  }));
}

// ============================================================
// CREATE IN SUPABASE
// ============================================================

async function createSupabaseOrder(order: OrderData, userSupabaseId: string | null): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: order.orderNumber,
        user_id: userSupabaseId,
        billing_email: order.billingEmail,
        billing_name: order.billingName,
        billing_phone: order.billingPhone,
        billing_address: order.billingAddress,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        status: order.status,
        payment_status: order.paymentStatus,
        completed_at: order.completedAt,
        created_at: order.createdAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create order ${order.orderNumber}:`, error);
    return null;
  }
}

async function createSupabaseOrderItem(
  item: OrderItemData,
  orderSupabaseId: string,
  eventSupabaseId: string | null,
  seminarSupabaseId: string | null,
  ticketTypeSupabaseId: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderSupabaseId,
        ticket_type_id: ticketTypeSupabaseId,
        event_id: eventSupabaseId,
        seminar_id: seminarSupabaseId,
        item_type: item.itemType,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create order item:`, error);
    return null;
  }
}

async function createSupabaseTicket(
  ticket: TicketData,
  ticketTypeSupabaseId: string,
  eventSupabaseId: string,
  orderSupabaseId: string,
  orderItemSupabaseId: string | null,
  userSupabaseId: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        ticket_code: ticket.ticketCode,
        ticket_type_id: ticketTypeSupabaseId,
        event_id: eventSupabaseId,
        order_id: orderSupabaseId,
        order_item_id: orderItemSupabaseId,
        user_id: userSupabaseId,
        attendee_name: ticket.attendeeName,
        attendee_email: ticket.attendeeEmail,
        qr_code_data: {
          ticket_code: ticket.ticketCode,
          event_id: eventSupabaseId,
          migrated_from_wp: true,
        },
        status: ticket.status,
        created_at: ticket.createdAt,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create ticket ${ticket.ticketCode}:`, error);
    return null;
  }
}

async function createSupabaseAttendance(
  attendance: AttendanceData,
  ticketSupabaseId: string,
  eventSupabaseId: string,
  userSupabaseId: string | null,
  checkedInBySupabaseId: string | null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        ticket_id: ticketSupabaseId,
        event_id: eventSupabaseId,
        user_id: userSupabaseId,
        checked_in_at: attendance.checkedInAt,
        check_in_method: attendance.checkInMethod,
        checked_in_by: checkedInBySupabaseId,
        notes: attendance.notes,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    log.error(`Failed to create attendance:`, error);
    return null;
  }
}

// ============================================================
// MAIN MIGRATION FUNCTION
// ============================================================

async function migrateOrders(options: { dryRun?: boolean; sinceDate?: string }): Promise<void> {
  const results = [
    createMigrationResult('orders'),
    createMigrationResult('order_items'),
    createMigrationResult('tickets'),
    createMigrationResult('attendance'),
  ];

  try {
    await loadMappingsFromFile();

    // Fetch all data
    const orders = await fetchWcOrders(options.sinceDate);
    const tickets = await fetchGpsTickets();
    const attendance = await fetchGpsAttendance();

    results[0].total = orders.length;
    results[1].total = orders.reduce((sum, o) => sum + o.items.length, 0);
    results[2].total = tickets.length;
    results[3].total = attendance.length;

    if (options.dryRun || migrationSettings.dryRun) {
      log.info('DRY RUN - No changes will be made');
      log.info(`Would migrate: ${orders.length} orders, ${results[1].total} order items, ${tickets.length} tickets, ${attendance.length} attendance records`);

      const outputPath = path.join(migrationSettings.outputDir, 'orders-export.json');
      await fs.mkdir(migrationSettings.outputDir, { recursive: true });
      await fs.writeFile(
        outputPath,
        JSON.stringify({ orders, tickets, attendance }, null, 2)
      );
      log.info(`Data exported to ${outputPath}`);
      return;
    }

    // ID mappings
    const orderIdMap = new Map<number, string>();
    const orderItemIdMap = new Map<number, string>();
    const ticketIdMap = new Map<number, string>();

    // Migrate orders
    log.info(`Migrating ${orders.length} orders...`);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      log.progress(i + 1, orders.length, 'Orders');

      try {
        const userSupabaseId = order.userWpId ? getSupabaseId(order.userWpId, 'user') : null;
        const orderSupabaseId = await createSupabaseOrder(order, userSupabaseId);

        if (!orderSupabaseId) {
          results[0].failed++;
          continue;
        }

        orderIdMap.set(order.wpId, orderSupabaseId);
        addIdMapping({ wpId: order.wpId, supabaseId: orderSupabaseId, type: 'order' });
        results[0].migrated++;

        // Create order items
        for (const item of order.items) {
          const eventSupabaseId = item.eventWpId ? getSupabaseId(item.eventWpId, 'event') : null;
          const seminarSupabaseId = item.seminarWpId ? getSupabaseId(item.seminarWpId, 'seminar') : null;
          const ticketTypeSupabaseId = item.ticketTypeWpId ? getSupabaseId(item.ticketTypeWpId, 'ticket_type') : null;

          const orderItemId = await createSupabaseOrderItem(
            item,
            orderSupabaseId,
            eventSupabaseId,
            seminarSupabaseId,
            ticketTypeSupabaseId
          );

          if (orderItemId) {
            results[1].migrated++;
          } else {
            results[1].failed++;
          }
        }
      } catch (error) {
        results[0].failed++;
        results[0].errors.push({
          id: order.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Migrate tickets
    log.info(`Migrating ${tickets.length} tickets...`);

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      log.progress(i + 1, tickets.length, 'Tickets');

      try {
        const ticketTypeSupabaseId = getSupabaseId(ticket.ticketTypeWpId, 'ticket_type');
        const eventSupabaseId = getSupabaseId(ticket.eventWpId, 'event');
        const orderSupabaseId = orderIdMap.get(ticket.orderWpId);
        const userSupabaseId = ticket.userWpId ? getSupabaseId(ticket.userWpId, 'user') : null;

        if (!ticketTypeSupabaseId || !eventSupabaseId || !orderSupabaseId) {
          log.warn(`Missing references for ticket ${ticket.wpId}`);
          results[2].skipped++;
          continue;
        }

        const ticketSupabaseId = await createSupabaseTicket(
          ticket,
          ticketTypeSupabaseId,
          eventSupabaseId,
          orderSupabaseId,
          null, // order item ID would need to be matched
          userSupabaseId
        );

        if (ticketSupabaseId) {
          ticketIdMap.set(ticket.wpId, ticketSupabaseId);
          addIdMapping({ wpId: ticket.wpId, supabaseId: ticketSupabaseId, type: 'ticket' });
          results[2].migrated++;
        } else {
          results[2].failed++;
        }
      } catch (error) {
        results[2].failed++;
        results[2].errors.push({
          id: ticket.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Migrate attendance
    log.info(`Migrating ${attendance.length} attendance records...`);

    for (let i = 0; i < attendance.length; i++) {
      const att = attendance[i];
      log.progress(i + 1, attendance.length, 'Attendance');

      try {
        const ticketSupabaseId = ticketIdMap.get(att.ticketWpId);
        const eventSupabaseId = getSupabaseId(att.eventWpId, 'event');
        const userSupabaseId = att.userWpId ? getSupabaseId(att.userWpId, 'user') : null;
        const checkedInBySupabaseId = att.checkedInByWpId ? getSupabaseId(att.checkedInByWpId, 'user') : null;

        if (!ticketSupabaseId || !eventSupabaseId) {
          results[3].skipped++;
          continue;
        }

        const attendanceId = await createSupabaseAttendance(
          att,
          ticketSupabaseId,
          eventSupabaseId,
          userSupabaseId,
          checkedInBySupabaseId
        );

        if (attendanceId) {
          results[3].migrated++;
        } else {
          results[3].failed++;
        }
      } catch (error) {
        results[3].failed++;
        results[3].errors.push({
          id: att.wpId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Save mappings and report
    await saveMappingsToFile();

    for (const result of results) {
      finishMigrationResult(result);
    }
    await saveMigrationReport(results);

    log.success(`
Migration complete:
  Orders: ${results[0].migrated}/${results[0].total} (${results[0].failed} failed)
  Order Items: ${results[1].migrated}/${results[1].total} (${results[1].failed} failed)
  Tickets: ${results[2].migrated}/${results[2].total} (${results[2].failed} failed, ${results[2].skipped} skipped)
  Attendance: ${results[3].migrated}/${results[3].total} (${results[3].failed} failed, ${results[3].skipped} skipped)
    `);
  } finally {
    await closeWpConnection();
  }
}

// ============================================================
// CLI ENTRY POINT
// ============================================================

const args = process.argv.slice(2);
const sinceArg = args.find(a => a.startsWith('--since='));

const options = {
  dryRun: args.includes('--dry-run'),
  sinceDate: sinceArg ? sinceArg.split('=')[1] : undefined,
};

migrateOrders(options)
  .then(() => process.exit(0))
  .catch(error => {
    log.error('Migration failed:', error);
    process.exit(1);
  });

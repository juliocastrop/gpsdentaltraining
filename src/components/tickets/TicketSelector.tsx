import { useState, useEffect } from 'react';
import Button from '../ui/Button';

interface TicketType {
  id: string;
  name: string;
  ticket_type: 'early_bird' | 'general' | 'vip' | 'other';
  price: number;
  description?: string;
  features?: string[];
  is_sold_out: boolean;
  is_manual_sold_out: boolean;
  sale_start?: string;
  sale_end?: string;
  show_in_listing?: boolean; // Backend control for VIP visibility
  display_priority?: number; // Lower = higher priority
  stock: {
    total: number;
    sold: number;
    available: number;
    unlimited: boolean;
  };
}

interface TicketSelectorProps {
  eventId: string;
  eventTitle: string;
}

export default function TicketSelector({ eventId, eventTitle }: TicketSelectorProps) {
  const [allTickets, setAllTickets] = useState<TicketType[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllTickets, setShowAllTickets] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [eventId]);

  /**
   * Filter and prioritize tickets based on:
   * 1. Sale date windows (early_bird should show only during its sale period)
   * 2. Backend visibility settings (show_in_listing)
   * 3. Display priority
   *
   * Logic:
   * - Show Early Bird ONLY if current date is within sale_start and sale_end
   * - When Early Bird expires, automatically show General Admission
   * - VIP tickets are optional based on show_in_listing flag from backend
   */
  function filterAndPrioritizeTickets(ticketList: TicketType[]): TicketType[] {
    const now = new Date();

    return ticketList
      .filter(ticket => {
        // Check if ticket is within its sale window
        const saleStart = ticket.sale_start ? new Date(ticket.sale_start) : null;
        const saleEnd = ticket.sale_end ? new Date(ticket.sale_end) : null;

        // If sale hasn't started yet, don't show
        if (saleStart && now < saleStart) return false;

        // If sale has ended, don't show (except for fallback to general)
        if (saleEnd && now > saleEnd) return false;

        // VIP tickets: only show if backend says to show them
        if (ticket.ticket_type === 'vip' && ticket.show_in_listing === false) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by display_priority if available
        if (a.display_priority !== undefined && b.display_priority !== undefined) {
          return a.display_priority - b.display_priority;
        }

        // Default priority: early_bird > general > vip > other
        const priorityOrder = { early_bird: 1, general: 2, vip: 3, other: 4 };
        return (priorityOrder[a.ticket_type] || 4) - (priorityOrder[b.ticket_type] || 4);
      });
  }

  // Get the primary ticket to display (the one with highest priority that's available)
  function getPrimaryTicket(ticketList: TicketType[]): TicketType | null {
    const filtered = filterAndPrioritizeTickets(ticketList);
    // Return first available ticket
    return filtered.find(t => !t.is_sold_out) || filtered[0] || null;
  }

  async function fetchTickets() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tickets/event/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setAllTickets(data.tickets || []);

      // Auto-select the primary (prioritized) ticket
      const primary = getPrimaryTicket(data.tickets || []);
      if (primary && !primary.is_sold_out) {
        setSelectedTicket(primary.id);
      }
    } catch (err) {
      setError('Failed to load ticket options');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Get tickets to display based on showAllTickets flag
  const tickets = showAllTickets
    ? filterAndPrioritizeTickets(allTickets)
    : filterAndPrioritizeTickets(allTickets).slice(0, 1); // Show only primary ticket by default

  function handleQuantityChange(delta: number) {
    const newQuantity = quantity + delta;
    const ticket = tickets.find(t => t.id === selectedTicket);

    if (newQuantity < 1) return;
    if (ticket && !ticket.stock.unlimited && newQuantity > ticket.stock.available) return;
    if (newQuantity > 10) return; // Max 10 tickets per order

    setQuantity(newQuantity);
  }

  async function handleAddToCart() {
    if (!selectedTicket) return;

    setIsAddingToCart(true);
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketTypeId: selectedTicket,
          eventId,
          quantity,
        }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      // Update cart count in header
      const cartCountEl = document.getElementById('cart-count');
      if (cartCountEl) {
        const currentCount = parseInt(cartCountEl.textContent || '0');
        cartCountEl.textContent = String(currentCount + quantity);
        cartCountEl.classList.remove('hidden');
      }

      // Optional: Show success message or redirect
      window.location.href = '/cart';
    } catch (err) {
      setError('Failed to add to cart. Please try again.');
      console.error(err);
    } finally {
      setIsAddingToCart(false);
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  const selectedTicketData = tickets.find(t => t.id === selectedTicket);
  const totalPrice = selectedTicketData ? selectedTicketData.price * quantity : 0;
  const allSoldOut = tickets.every(t => t.is_sold_out);
  const hasMultipleTicketOptions = filterAndPrioritizeTickets(allTickets).length > 1;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gps-navy-dark mb-4">
        Select Your Ticket
      </h3>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Ticket Options */}
      <div className="space-y-3 mb-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => !ticket.is_sold_out && setSelectedTicket(ticket.id)}
            className={`ticket-option relative ${
              selectedTicket === ticket.id ? 'ticket-option-selected' : ''
            } ${ticket.is_sold_out ? 'ticket-option-soldout' : ''}`}
          >
            {/* Badge for ticket type */}
            {ticket.ticket_type === 'early_bird' && !ticket.is_sold_out && (
              <div className="absolute -top-2 -left-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                EARLY BIRD
              </div>
            )}
            {ticket.ticket_type === 'vip' && !ticket.is_sold_out && (
              <div className="absolute -top-2 -left-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                VIP
              </div>
            )}

            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gps-navy-dark">{ticket.name}</h4>
                  {ticket.is_sold_out && (
                    <span className="badge-danger text-xs">Sold Out</span>
                  )}
                </div>
                {ticket.description && (
                  <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                )}
                {ticket.features && ticket.features.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {ticket.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center gap-1">
                        <svg className="w-4 h-4 text-gps-success" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                {/* Show sale end date for early bird */}
                {ticket.ticket_type === 'early_bird' && ticket.sale_end && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    ⏰ Offer ends {new Date(ticket.sale_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="text-right ml-4">
                <div className="text-xl font-bold text-gps-navy-dark">
                  {formatPrice(ticket.price)}
                </div>
                {!ticket.is_sold_out && !ticket.stock.unlimited && (
                  <div className="text-sm text-gray-500">
                    {ticket.stock.available} remaining
                  </div>
                )}
              </div>
            </div>

            {/* Selection indicator */}
            {!ticket.is_sold_out && (
              <div className="absolute top-4 right-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTicket === ticket.id
                    ? 'border-gps-cta bg-gps-cta'
                    : 'border-gray-300'
                }`}>
                  {selectedTicket === ticket.id && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more ticket options button */}
      {hasMultipleTicketOptions && !showAllTickets && (
        <button
          type="button"
          onClick={() => setShowAllTickets(true)}
          className="w-full text-center text-sm text-gps-blue hover:text-gps-navy-dark font-medium py-2 mb-4 transition-colors"
        >
          View other ticket options →
        </button>
      )}
      {showAllTickets && hasMultipleTicketOptions && (
        <button
          type="button"
          onClick={() => setShowAllTickets(false)}
          className="w-full text-center text-sm text-gray-500 hover:text-gps-navy-dark font-medium py-2 mb-4 transition-colors"
        >
          ← Show less
        </button>
      )}

      {/* Quantity Selector */}
      {selectedTicket && !allSoldOut && (
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
          <span className="font-medium text-gps-navy-dark">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={
                quantity >= 10 ||
                (selectedTicketData && !selectedTicketData.stock.unlimited && quantity >= selectedTicketData.stock.available)
              }
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Total and Add to Cart */}
      {selectedTicket && !allSoldOut && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-bold text-gps-navy-dark">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            isLoading={isAddingToCart}
          >
            Add to Cart
          </Button>
        </div>
      )}

      {/* Sold Out - Show Waitlist Option */}
      {allSoldOut && (
        <div className="text-center py-4">
          <p className="text-gray-600 mb-4">
            All tickets for this event are currently sold out.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              // Scroll to waitlist form or show modal
              const waitlistSection = document.getElementById('waitlist-section');
              waitlistSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Join Waitlist
          </Button>
        </div>
      )}
    </div>
  );
}

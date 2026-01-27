-- ============================================================
-- Cart Recovery Tables
-- Phase 10: Abandoned cart tracking and recovery system
-- ============================================================

-- Abandoned Carts Table
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cart identification
  session_id VARCHAR(255) NOT NULL,
  cart_hash VARCHAR(64), -- Hash of cart contents for deduplication

  -- User information (can be null for guests)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),

  -- Cart contents
  cart_contents JSONB NOT NULL DEFAULT '[]',
  cart_total DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  item_count INT DEFAULT 0,

  -- Recovery tracking
  status VARCHAR(50) DEFAULT 'abandoned', -- abandoned, notified, recovered, expired, converted
  recovery_token VARCHAR(100) UNIQUE,
  checkout_url TEXT,

  -- Email sequence tracking
  emails_sent INT DEFAULT 0,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  next_email_scheduled_at TIMESTAMP WITH TIME ZONE,
  email_sequence_completed BOOLEAN DEFAULT false,

  -- Coupon/discount
  coupon_code VARCHAR(50),
  coupon_applied BOOLEAN DEFAULT false,
  discount_amount DECIMAL(10, 2) DEFAULT 0,

  -- AI chat (optional feature)
  chat_initiated BOOLEAN DEFAULT false,
  chat_messages JSONB DEFAULT '[]',

  -- Source tracking
  source_url TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  ip_address INET,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  abandoned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recovered_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('abandoned', 'notified', 'recovered', 'expired', 'converted'))
);

-- Cart Recovery Email Templates
CREATE TABLE IF NOT EXISTS cart_recovery_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Email content
  subject VARCHAR(255) NOT NULL,
  preview_text VARCHAR(255),
  html_content TEXT NOT NULL,
  text_content TEXT,

  -- Sequence settings
  sequence_order INT NOT NULL DEFAULT 1, -- 1st, 2nd, 3rd email
  delay_hours INT NOT NULL DEFAULT 1, -- Hours after abandonment to send

  -- Coupon settings
  include_coupon BOOLEAN DEFAULT false,
  coupon_type VARCHAR(50), -- fixed, percentage
  coupon_value DECIMAL(10, 2),
  coupon_expiry_hours INT DEFAULT 48,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Recovery Email History
CREATE TABLE IF NOT EXISTS cart_recovery_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  cart_id UUID NOT NULL REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES cart_recovery_templates(id) ON DELETE SET NULL,

  -- Email details
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  sequence_number INT NOT NULL DEFAULT 1,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, bounced, failed

  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,

  -- Error tracking
  error_message TEXT,

  -- Resend tracking
  resend_message_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Recovery Settings
CREATE TABLE IF NOT EXISTS cart_recovery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Settings key-value
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,

  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Recovery Analytics (daily aggregates)
CREATE TABLE IF NOT EXISTS cart_recovery_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  date DATE NOT NULL UNIQUE,

  -- Cart metrics
  carts_abandoned INT DEFAULT 0,
  carts_recovered INT DEFAULT 0,
  carts_expired INT DEFAULT 0,

  -- Value metrics
  abandoned_value DECIMAL(12, 2) DEFAULT 0,
  recovered_value DECIMAL(12, 2) DEFAULT 0,

  -- Email metrics
  emails_sent INT DEFAULT 0,
  emails_opened INT DEFAULT 0,
  emails_clicked INT DEFAULT 0,

  -- Conversion metrics
  recovery_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session ON abandoned_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user ON abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery_token ON abandoned_carts(recovery_token);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created ON abandoned_carts(created_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_abandoned ON abandoned_carts(abandoned_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_next_email ON abandoned_carts(next_email_scheduled_at) WHERE status = 'abandoned' AND NOT email_sequence_completed;

CREATE INDEX IF NOT EXISTS idx_cart_recovery_emails_cart ON cart_recovery_emails(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_recovery_emails_status ON cart_recovery_emails(status);
CREATE INDEX IF NOT EXISTS idx_cart_recovery_emails_sent ON cart_recovery_emails(sent_at);

CREATE INDEX IF NOT EXISTS idx_cart_recovery_analytics_date ON cart_recovery_analytics(date);

-- ============================================================
-- Functions for Cart Recovery
-- ============================================================

-- Function to update abandoned_carts.updated_at
CREATE OR REPLACE FUNCTION update_abandoned_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_abandoned_cart_timestamp ON abandoned_carts;
CREATE TRIGGER trigger_update_abandoned_cart_timestamp
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_abandoned_cart_timestamp();

-- Function to generate recovery token
CREATE OR REPLACE FUNCTION generate_recovery_token()
RETURNS VARCHAR(100) AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cart hash
CREATE OR REPLACE FUNCTION calculate_cart_hash(cart_contents JSONB)
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(sha256(cart_contents::text::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Insert Default Email Templates
-- ============================================================

INSERT INTO cart_recovery_templates (name, slug, subject, preview_text, html_content, sequence_order, delay_hours, include_coupon, coupon_type, coupon_value) VALUES
(
  'First Reminder',
  'first-reminder',
  'Did you forget something? Your cart is waiting!',
  'Complete your registration for GPS Dental Training',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0C2044; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; }
    .content { padding: 30px; background: #f9f9f9; }
    .cart-items { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .btn { display: inline-block; background: #0B52AC; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GPS Dental Training</h1>
    </div>
    <div class="content">
      <h2>Hi {{first_name}},</h2>
      <p>We noticed you left some items in your cart. Don''t miss out on this opportunity to enhance your dental training!</p>

      <div class="cart-items">
        {{cart_items}}
      </div>

      <p style="text-align: center;">
        <a href="{{checkout_url}}" class="btn">Complete Your Registration</a>
      </p>

      <p>If you have any questions, our team is here to help!</p>
    </div>
    <div class="footer">
      <p>GPS Dental Training | Dr. Reena</p>
      <p>If you no longer wish to receive these emails, <a href="{{unsubscribe_url}}">unsubscribe here</a>.</p>
    </div>
  </div>
</body>
</html>',
  1,
  1,
  false,
  NULL,
  NULL
),
(
  'Second Reminder with Discount',
  'second-reminder-discount',
  '{{first_name}}, here''s 10% off to complete your registration!',
  'Save 10% on your GPS Dental Training registration',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0C2044; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; }
    .content { padding: 30px; background: #f9f9f9; }
    .discount-box { background: #DDC89D; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .discount-code { font-size: 24px; font-weight: bold; color: #0C2044; letter-spacing: 2px; }
    .cart-items { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .btn { display: inline-block; background: #0B52AC; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GPS Dental Training</h1>
    </div>
    <div class="content">
      <h2>Hi {{first_name}},</h2>
      <p>We really want you to join us! As a special thank you, here''s an exclusive 10% discount on your cart:</p>

      <div class="discount-box">
        <p>Use code at checkout:</p>
        <p class="discount-code">{{coupon_code}}</p>
        <p style="font-size: 14px; color: #666;">Valid for 48 hours</p>
      </div>

      <div class="cart-items">
        {{cart_items}}
      </div>

      <p style="text-align: center;">
        <a href="{{checkout_url}}" class="btn">Complete Your Registration</a>
      </p>
    </div>
    <div class="footer">
      <p>GPS Dental Training | Dr. Reena</p>
      <p>If you no longer wish to receive these emails, <a href="{{unsubscribe_url}}">unsubscribe here</a>.</p>
    </div>
  </div>
</body>
</html>',
  2,
  24,
  true,
  'percentage',
  10
),
(
  'Final Reminder',
  'final-reminder',
  'Last chance: Your cart expires soon!',
  'Final reminder for your GPS Dental Training registration',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0C2044; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; }
    .content { padding: 30px; background: #f9f9f9; }
    .urgency { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .cart-items { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .btn { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GPS Dental Training</h1>
    </div>
    <div class="content">
      <h2>{{first_name}}, this is your final reminder!</h2>

      <div class="urgency">
        <strong>Your cart will expire in 24 hours.</strong> Don''t miss your chance to register for this training opportunity.
      </div>

      <div class="cart-items">
        {{cart_items}}
      </div>

      <p style="text-align: center;">
        <a href="{{checkout_url}}" class="btn">Complete Registration Now</a>
      </p>

      <p>If you have any questions or need assistance, please reply to this email and we''ll be happy to help.</p>
    </div>
    <div class="footer">
      <p>GPS Dental Training | Dr. Reena</p>
      <p>If you no longer wish to receive these emails, <a href="{{unsubscribe_url}}">unsubscribe here</a>.</p>
    </div>
  </div>
</body>
</html>',
  3,
  72,
  false,
  NULL,
  NULL
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Insert Default Settings
-- ============================================================

INSERT INTO cart_recovery_settings (key, value) VALUES
('enabled', 'true'::jsonb),
('abandonment_threshold_minutes', '30'::jsonb),
('max_emails_per_cart', '3'::jsonb),
('cart_expiry_days', '7'::jsonb),
('default_sender_name', '"GPS Dental Training"'::jsonb),
('default_sender_email', '"noreply@gpsdentaltraining.com"'::jsonb),
('unsubscribe_url', '"/unsubscribe"'::jsonb),
('auto_generate_coupons', 'true'::jsonb),
('coupon_prefix', '"SAVE"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_analytics ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (service role bypass RLS by default)
CREATE POLICY "Admin access for abandoned_carts" ON abandoned_carts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admin access for cart_recovery_templates" ON cart_recovery_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admin access for cart_recovery_emails" ON cart_recovery_emails
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admin access for cart_recovery_settings" ON cart_recovery_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Admin access for cart_recovery_analytics" ON cart_recovery_analytics
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND role = 'admin')
  );

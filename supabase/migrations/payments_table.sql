-- Bank-transfer payment submissions for hostel rooms and room exemptions.
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  payment_type VARCHAR(30) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payer_name VARCHAR(255) NOT NULL,
  payer_bank VARCHAR(255) NOT NULL,
  recipient_account_number VARCHAR(20) NOT NULL,
  recipient_account_name VARCHAR(255) NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  reference_id VARCHAR(100) NOT NULL UNIQUE,
  transfer_date DATE NOT NULL,
  remarks TEXT,
  authorized_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT payments_type_check CHECK (payment_type IN ('room_fee', 'room_exemption')),
  CONSTRAINT payments_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT payments_amount_check CHECK (amount > 0),
  CONSTRAINT payments_exemption_amount_check CHECK (
    payment_type <> 'room_exemption' OR amount = 20000
  ),
  CONSTRAINT payments_room_fee_room_check CHECK (
    payment_type <> 'room_fee' OR room_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own payments" ON public.payments
  FOR SELECT
  USING (student_id = auth.uid());

-- Requires a fresh emailed one-time code (verified within 15 minutes) and a
-- pending status, so students cannot self-approve or skip email authorization.
CREATE POLICY "Students can submit email-authorized payments" ON public.payments
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
    AND authorized_email = auth.jwt() ->> 'email'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(auth.jwt() -> 'amr') AS method
      WHERE method ->> 'method' IN ('otp', 'magiclink')
        AND (method ->> 'timestamp')::bigint > extract(epoch FROM now()) - 900
    )
  );

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Admins can review payments" ON public.payments
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email'));

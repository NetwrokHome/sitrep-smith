-- Create reports table for storing intelligence reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp BIGINT NOT NULL,
  output TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  analysis JSONB NOT NULL,
  threat_level TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_configurations table for storing user-specific configurations
CREATE TABLE public.user_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  action_mapping JSONB DEFAULT '{}',
  location_codes JSONB DEFAULT '{}',
  target_mapping JSONB DEFAULT '{}',
  militant_groups JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reports table
CREATE POLICY "Users can view their own reports" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
ON public.reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_configurations table
CREATE POLICY "Users can view their own configuration" 
ON public.user_configurations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own configuration" 
ON public.user_configurations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own configuration" 
ON public.user_configurations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own configuration" 
ON public.user_configurations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_configurations_updated_at
  BEFORE UPDATE ON public.user_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_timestamp ON public.reports(timestamp);
CREATE INDEX idx_reports_threat_level ON public.reports(threat_level);
CREATE INDEX idx_user_configurations_user_id ON public.user_configurations(user_id);
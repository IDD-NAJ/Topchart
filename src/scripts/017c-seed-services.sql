-- Simple migration: Seed sample services
-- Part 3: Insert sample data

INSERT INTO verification_services (pvadeals_service_id, name, category, country, markup_percentage, str_price, ltr3_price, ltr7_price, ltr14_price, ltr30_price) VALUES
('whatsapp', 'WhatsApp', 'social_media', 'US', 40.00, 0.50, 1.50, 3.00, 5.00, 10.00),
('telegram', 'Telegram', 'social_media', 'US', 40.00, 0.50, 1.50, 3.00, 5.00, 10.00),
('facebook', 'Facebook', 'social_media', 'US', 40.00, 0.60, 1.80, 3.60, 6.00, 12.00),
('instagram', 'Instagram', 'social_media', 'US', 40.00, 0.60, 1.80, 3.60, 6.00, 12.00),
('twitter', 'Twitter / X', 'social_media', 'US', 40.00, 0.60, 1.80, 3.60, 6.00, 12.00),
('tiktok', 'TikTok', 'social_media', 'US', 40.00, 0.55, 1.65, 3.30, 5.50, 11.00),
('google', 'Google / Gmail', 'social_media', 'US', 40.00, 0.50, 1.50, 3.00, 5.00, 10.00),
('amazon', 'Amazon', 'ecommerce_financial', 'US', 40.00, 0.80, 2.40, 4.80, 8.00, 16.00),
('paypal', 'PayPal', 'ecommerce_financial', 'US', 40.00, 1.00, 3.00, 6.00, 10.00, 20.00),
('discord', 'Discord', 'professional_tools', 'US', 40.00, 0.50, 1.50, 3.00, 5.00, 10.00),
('linkedin', 'LinkedIn', 'professional_tools', 'US', 40.00, 0.60, 1.80, 3.60, 6.00, 12.00),
('netflix', 'Netflix', 'streaming_entertainment', 'US', 40.00, 0.60, 1.80, 3.60, 6.00, 12.00)
ON CONFLICT (pvadeals_service_id) DO NOTHING;

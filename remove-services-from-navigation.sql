-- Remove eSIM, proxies, and gift cards from navigation_links table
DELETE FROM navigation_links 
WHERE label ILIKE '%esim%' 
   OR label ILIKE '%proxy%' 
   OR label ILIKE '%gift card%'
   OR href ILIKE '%/esim%'
   OR href ILIKE '%/proxy%'
   OR href ILIKE '%/giftcard%';

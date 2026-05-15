# Tawk.to Chat Widget Setup Guide

## Step 1: Get Your Tawk.to Credentials

1. Go to [Tawk.to](https://www.tawk.to) and sign up/login
2. Create a new property or select an existing one
3. Go to the widget settings for your property
4. Copy the **Property ID** and **Widget ID** from the widget code

Example widget code:
```html
<!--Start of Tawk.to Script-->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/[PROPERTY_ID]/[WIDGET_ID]';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
<!--End of Tawk.to Script-->
```

- **Property ID**: The first part of the URL (e.g., `671234567890`)
- **Widget ID**: The second part after the slash (e.g., `default` or a custom ID)

## Step 2: Add Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_TAWK_PROPERTY_ID=your-property-id-here
NEXT_PUBLIC_TAWK_WIDGET_ID=your-widget-id-here
NEXT_PUBLIC_TAWK_ENABLED=true
```

## Step 3: Configure Domain in Tawk.to Dashboard

1. Go to Tawk.to dashboard
2. Navigate to Administration > Chat Widget
3. Add your domain `https://topchart.store` to the allowed domains
4. Save the configuration

## Step 4: Restart Development Server

After adding the environment variables, restart your dev server:

```bash
npm run dev
```

## Step 5: Verify Widget is Working

1. Visit your website
2. The chat widget should appear in the bottom right corner
3. Check browser console for any errors
4. Test sending a message to verify functionality

## Troubleshooting

### Widget Not Showing
- Check that `NEXT_PUBLIC_TAWK_ENABLED=true` is set
- Verify Property ID and Widget ID are correct
- Check browser console for errors
- Ensure you're not on an admin route (widget is hidden on admin routes)

### CORS Errors
- Add your domain to Tawk.to allowed domains
- Contact Tawk.to support if CORS issues persist
- Set `NEXT_PUBLIC_TAWK_ENABLED=false` to disable temporarily

### Widget Shows But Can't Send Messages
- Verify widget is not in "Away" mode in Tawk.to dashboard
- Check if you have agents online in Tawk.to
- Ensure domain is properly whitelisted

## Current Integration

The Tawk.to widget is already integrated in the application:
- Location: `src/components/tawk-chat.tsx`
- Imported in: `src/app/layout.tsx`
- Automatically disabled in development
- Hidden on admin routes
- Passes user attributes when logged in

## Customization

You can customize the widget appearance and behavior in the Tawk.to dashboard:
- Widget position
- Widget color
- Welcome message
- Operating hours
- Agent assignment

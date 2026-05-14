# Google Search Console & Bing Webmaster Setup

## Google Search Console Setup

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Sign in with your Google account
3. Click "Add a property" and select "URL prefix"
4. Enter `https://topchart.store` and click "Continue"
5. Choose verification method:
   - **HTML file upload** (recommended for production)
   - **HTML meta tag** - Add the verification code to `src/app/layout.tsx` in the `verification.google` field
   - **Google Analytics** - If you have GA already set up
   - **Google Tag Manager** - If you use GTM
6. Complete verification by following the chosen method's instructions
7. Once verified, submit your sitemap:
   - Go to "Sitemaps" in the left sidebar
   - Enter `sitemap.xml`
   - Click "Submit"

## Bing Webmaster Tools Setup

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Sign in with your Microsoft account
3. Click "Add a site"
4. Enter `https://topchart.store` and click "Add"
5. Choose verification method:
   - **XML file upload** - Upload the provided XML file to your root
   - **Meta tag** - Add the verification meta tag to `src/app/layout.tsx`
   - **CNAME record** - Add a DNS CNAME record
6. Complete verification
7. Submit your sitemap:
   - Go to "Sitemaps" in the left sidebar
   - Enter `https://topchart.store/sitemap.xml`
   - Click "Submit"

## Adding Verification Code to Topchart

To add the Google verification code to the layout:

1. Get your verification code from Google Search Console (it looks like a random string)
2. Open `src/app/layout.tsx`
3. Find the `verification` object in the metadata
4. Replace the empty string with your code:
   ```typescript
   verification: {
     google: 'your-verification-code-here',
   },
   ```

## Important Notes

- Sitemap is already configured at `https://topchart.store/sitemap.xml`
- Robots.txt is configured at `https://topchart.store/robots.txt`
- JSON-LD schema markup is already implemented for:
  - Organization
  - WebSite
  - FAQPage
  - SiteNavigationElement
  - ItemList

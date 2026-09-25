# Village Butchers, Alvechurch

The one-page website for **Village Butchers**, 34 Red Lion Street, Alvechurch, Birmingham B48 7LF.
Built by [King Media](https://kingmedia.uk).

It's a plain static site with no build step, no frameworks, no cookies and no tracking.

| Path | What it is |
|---|---|
| `index.html` | The page |
| `css/style.css` | The layout and design |
| `css/motion.css` | Animations, switched off automatically for anyone whose device is set to reduce motion |
| `js/main.js` | Opening hours and the live "Open now" status (UK time), the text-size control, the phone quick-bar and the map zoom |
| `js/motion.js` | Scroll reveals, the map pin drop and the rating count |
| `js/prepaint.js` | Applies the saved text size before the page draws |
| `assets/` | Self-hosted fonts, photos and the share image |
| `.htaccess` | HTTPS, security headers and caching for Apache or Hostinger |

## Preview locally

    python3 -m http.server 8321

Then open http://localhost:8321

## Changing the opening hours

1. Edit `HOURS` at the top of `js/main.js`. For special dates such as Christmas, use `SPECIAL` just below it.
2. Update the matching rows written into `index.html`: the hours table, the footer and the JSON-LD. That way the page is also right without JavaScript.
3. Bump the `?v=` numbers on the CSS and JS links when you change them.

## Credits

The food photos are licensed stock images; see "Photo credits" in the page footer. The map data is © OpenStreetMap contributors.

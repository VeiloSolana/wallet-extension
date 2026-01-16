# How to Host Your Privacy Policy

Chrome Web Store requires a publicly accessible URL for your privacy policy. Here are your options:

## Option 1: GitHub Raw URL (Easiest - 2 minutes)

1. Commit the PRIVACY_POLICY.md file to your repository
2. Push to GitHub
3. Use this URL format:
   ```
   https://raw.githubusercontent.com/VeiloSolana/wallet-extension/master/extension-ui/PRIVACY_POLICY.md
   ```

**Pros:** Immediate, no setup required  
**Cons:** Shows raw markdown (acceptable for Chrome Web Store)

## Option 2: GitHub Pages (Recommended - 5 minutes)

1. Create a `docs/` folder in your repository root:

   ```bash
   mkdir -p docs
   cp extension-ui/PRIVACY_POLICY.md docs/privacy-policy.md
   ```

2. Create `docs/index.html`:

   ```html
   <!DOCTYPE html>
   <html>
     <head>
       <title>Veilo Privacy Policy</title>
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <style>
         body {
           font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
             sans-serif;
           max-width: 800px;
           margin: 40px auto;
           padding: 20px;
           line-height: 1.6;
         }
         h1 {
           color: #333;
         }
         h2 {
           color: #555;
           margin-top: 2em;
         }
       </style>
     </head>
     <body>
       <div id="content"></div>
       <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
       <script>
         fetch("privacy-policy.md")
           .then((response) => response.text())
           .then((text) => {
             document.getElementById("content").innerHTML = marked.parse(text);
           });
       </script>
     </body>
   </html>
   ```

3. Enable GitHub Pages:

   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: master/main, folder: `/docs`
   - Save

4. Your privacy policy URL will be:
   ```
   https://veilosolana.github.io/wallet-extension/
   ```

**Pros:** Clean, professional presentation  
**Cons:** Requires GitHub Pages setup

## Option 3: Host on Your Domain (Professional - 10 minutes)

If you have a website (e.g., veilo.io):

1. Upload PRIVACY_POLICY.md to your server
2. Convert to HTML or use a markdown renderer
3. Make it accessible at:
   ```
   https://veilo.io/privacy-policy
   ```

**Pros:** Most professional, branded  
**Cons:** Requires existing website/domain

## Recommended Approach

**For quick resubmission:** Use Option 1 (GitHub Raw URL)  
**For production:** Use Option 2 (GitHub Pages)

## After Hosting

1. Copy the URL
2. Paste it in the Chrome Web Store Developer Dashboard:
   - Account & privacy → Privacy policy field
3. Verify the URL is publicly accessible (test in incognito mode)

## Example URLs

Replace `VeiloSolana` and `wallet-extension` with your actual repository details:

**GitHub Raw:**

```
https://raw.githubusercontent.com/VeiloSolana/wallet-extension/master/extension-ui/PRIVACY_POLICY.md
```

**GitHub Pages:**

```
https://veilosolana.github.io/wallet-extension/
```

---

**Note:** The privacy policy URL must be publicly accessible and cannot be changed after approval without triggering a review. Choose carefully!

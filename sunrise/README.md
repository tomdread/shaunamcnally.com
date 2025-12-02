# Print Template

This is a template for creating new print/artwork pages on the Shauna McNally website.

## How to Use

1. **Create a new folder** for your artwork (e.g., `my-artwork-name`)
2. **Copy** `index.html` from this template folder to your new folder
3. **Replace the following placeholders** in the copied `index.html`:

### Placeholders to Replace:

- `[ARTWORK_TITLE]` - The title of your artwork (appears in heading, meta tags, and throughout)
- `[FOLDER_NAME]` - The name of the folder you created (e.g., `my-artwork-name`)
- `[IMAGE_FILENAME]` - The filename of your artwork image (e.g., `my-artwork-01.jpeg`)
- `[DESCRIPTION_PARAGRAPH_1]` - First paragraph of description
- `[DESCRIPTION_PARAGRAPH_2]` - Second paragraph of description (add more `<p>` tags as needed)
- `[PRODUCT_ID]` - Your Stripe product ID (e.g., `prod_ABC123xyz`)
- `[STRIPE_CHECKOUT_URL]` - Your Stripe checkout URL (e.g., `https://buy.stripe.com/...`)
- `[TECHNICAL_DETAILS_TEXT]` - Pricing and technical information (e.g., "Fine Art Print, Including Shipping", "A4 30.00 eur")

### Optional:

- **Audio player**: Uncomment the audio player section if your artwork has an audio file
- **Additional paragraphs**: Add more `<p>` tags in the description section as needed

## Example

After replacing placeholders, a line might look like:
```html
<title>Big Rock Candy Mountain | Shauna McNally</title>
```

Instead of:
```html
<title>[ARTWORK_TITLE] | Shauna McNally</title>
```

## Notes

- All paths use absolute paths starting with `/`, so make sure your folder structure matches
- The template includes all necessary sections: header, navigation, artwork image, description, purchase buttons, and technical details
- Remember to add your image file(s) to the same folder as your `index.html`


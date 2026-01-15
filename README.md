# Pixel Whisperer
An accessibility-focused web app to help colourblind users interpret visual data. Allows user to upload an image, mouse over a pixel, and receive a label for that colour. It uses the [ISCC-NBS Colour System](https://www.munsellcolorscienceforpainters.com/ISCCNBS/ISCCNBSSystem.html) for colour labels, with some additional greyscale values added.
Under development by Rhys Fenwick, 2025, as part of an Australian National University accessibility project.

## License
This software is published under the [MIT License](https://opensource.org/license/mit).

## Credit/inspiration:
[Name the Color by Chirag Mehta](https://chir.ag/projects/name-that-color/)

[Color Name & Hue by Daniel Flueck](https://www.color-blindness.com/color-name-hue/)

[sRGB Centroids for the ISCC-NBS Colour System by Paul Centore](https://www.munsellcolorscienceforpainters.com/ColourSciencePapers/sRGBCentroidsForTheISCCNBSColourSystem.pdf)

A huge thank you to Cait Greenup, Maximillian Ringland, and Professor Joe Coventry for their assistance and support.

## TODO
- Make crosshairs fall on pixel, not between them
- Make scrollbars fall outside image if possible
- Average out colour over area (thanks Cam!)
- Intensity measurement? (possibly HSV rather than RGB, or alpha channel)
- Add live feed function
- Make selected pixels refer back to where on screen when clicked
- Labels on the picture for selected pixels
- Colour boxes on selected pixel list

## Broader Accessibility
- Keyboard controls (maybe have keyboard input reset to top left?)
- Bulk file analysis
- "Reverse engineer" mode - start with colour, highlight it on the picture
- Custm colour list upload

## Fixes needed
- Pixel off-by-one
- General button padding reduction/spacing
- Redo ANU branding/overall aesthetics
- Mag glass resets on size change
- Touch functionality (done-ish - two-finger scroll to be integrated)
- Phone layout centering (done)
- Camera to switch off when tab not in use
- Pixel selection doesn't update on scroll
- Crosshair clamping doesn't handle overall window scrolling well
- Deal with transparency





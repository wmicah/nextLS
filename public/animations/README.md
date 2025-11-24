# Sidebar Icon Animations

This directory contains Lottie animation JSON files from [useanimations.com](https://useanimations.com/#explore).

## Required Animation Files

Download the following animations from https://useanimations.com/#explore and place them in this directory:

1. **home.json** - Home icon (Navigation section, "Hover me")
2. **userPlus.json** - User plus icon (Content section, "Hover me") - Note: filename is userPlus.json (camelCase)
3. **bookmark.json** - Bookmark icon (Action section, "Hover me")
4. **file.json** - File icon (Content section, "Hover me") - Used for Programs/Routines
5. **calendar.json** - Calendar icon (Action section, "Hover me")
6. **video.json** - Video icon (Media section, "Click me" or "Loop")
7. **briefcase.json** - Briefcase icon (Action section, "Hover me") - Used for Organization
8. **settings.json** - Settings icon (Action section, "Hover me" or "Click me")

## How to Download

1. Visit https://useanimations.com/#explore
2. Find each icon in the sections listed above
3. Click the "Download" button for each icon
4. Save the JSON file with the exact name listed above
5. Place all files in this `public/animations/` directory

## Notes

- The animations will automatically loop when you hover over the sidebar links
- If an animation file is missing, the component will fall back to the regular static icon
- All animations should be the "Hover me" or "Loop" versions for continuous playback


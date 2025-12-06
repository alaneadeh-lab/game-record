# Badge Creation Instructions

To create the 2nd, 3rd, and tomato badges from `first-place-badg.png`:

## Required Files

Place these files in `src/assets/`:
- `second-place-badge.png` - "2" with silver color
- `third-place-badge.png` - "3" with bronze color  
- `tomato-badge.png` - Tomato emoji/icon with mint green color

## Steps to Create Badges

### Option 1: Using Image Editor (Recommended)

1. **Second Place Badge:**
   - Open `src/assets/first-place-badg.png` in Photoshop/GIMP/Figma
   - Replace the "1" with "2"
   - Change all gold colors to silver (#C0C0C0 or similar)
   - Keep everything else identical
   - Save as `src/assets/second-place-badge.png`

2. **Third Place Badge:**
   - Open `src/assets/first-place-badg.png` in Photoshop/GIMP/Figma
   - Replace the "1" with "3"
   - Change all gold colors to bronze (#CD7F32 or similar)
   - Keep everything else identical
   - Save as `src/assets/third-place-badge.png`

3. **Tomato Badge:**
   - Open `src/assets/first-place-badg.png` in Photoshop/GIMP/Figma
   - Replace the "1" with a tomato emoji (🍅) or tomato icon
   - Change all gold colors to light emerald/mint green (#98FB98 or similar)
   - Keep everything else identical
   - Save as `src/assets/tomato-badge.png`

### Option 2: Using Online Tools

- Canva: Upload the badge, edit text and colors
- Photopea: Free online Photoshop alternative
- GIMP: Free desktop image editor

## Color Reference

- **Gold (original):** #FFD700 or similar
- **Silver (2nd place):** #C0C0C0 or #B8B8B8
- **Bronze (3rd place):** #CD7F32 or #A0522D
- **Mint Green (tomato):** #98FB98 or #A0E7E5

## After Creating the Files

Once you've created the three badge files and placed them in `src/assets/`, the components are already set up to use them. Just uncomment the import statements in:
- `src/components/SecondPlaceBadge.tsx`
- `src/components/ThirdPlaceBadge.tsx`
- `src/components/TomatoBadge.tsx`


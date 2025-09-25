#!/bin/bash

# RESPONSIVE IMAGE GENERATION SCRIPT
# Creates multiple sizes for each image using ImageMagick

# Function to create responsive versions of an image
create_responsive_versions() {
    local input_file="$1"
    local base_name=$(basename "$input_file" | cut -d. -f1)
    local extension="${input_file##*.}"
    local output_dir=$(dirname "$input_file")

    echo "Processing $input_file..."

    # Create different sizes
    convert "$input_file" -resize 480x -quality 85 "$output_dir/${base_name}-480w.$extension"
    convert "$input_file" -resize 768x -quality 85 "$output_dir/${base_name}-768w.$extension"
    convert "$input_file" -resize 1024x -quality 85 "$output_dir/${base_name}-1024w.$extension"
    convert "$input_file" -resize 1920x -quality 85 "$output_dir/${base_name}-1920w.$extension"

    # Create WebP versions for modern browsers
    convert "$input_file" -resize 480x -quality 85 "$output_dir/${base_name}-480w.webp"
    convert "$input_file" -resize 768x -quality 85 "$output_dir/${base_name}-768w.webp"
    convert "$input_file" -resize 1024x -quality 85 "$output_dir/${base_name}-1024w.webp"
    convert "$input_file" -resize 1920x -quality 85 "$output_dir/${base_name}-1920w.webp"

    echo "✓ Created responsive versions for $base_name"
}

# Process all images in the images directory
find images/ -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | while read -r image; do
    create_responsive_versions "$image"
done

echo "🎉 Responsive image generation completed!"
echo "Now update your HTML files to use the srcset attributes."
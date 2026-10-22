from rembg import remove
from PIL import Image
import os

input_path = "C:/Users/Administrator/.gemini/antigravity/brain/962c662f-0f3a-43d6-a93c-9d39d1944e2f/.user_uploaded/media_1792694198038_9a050671.jpg"
output_artifact = "C:/Users/Administrator/.gemini/antigravity/brain/962c662f-0f3a-43d6-a93c-9d39d1944e2f/logo-ikspi-mantup-transparent.png"
public_logo = "s:/sikap-mantup/public/logo-ikspi-mantup.png"
icon_192 = "s:/sikap-mantup/public/icon-192.png"
icon_512 = "s:/sikap-mantup/public/icon-512.png"
app_icon = "s:/sikap-mantup/src/app/icon.png"

print("Loading input image...")
input_image = Image.open(input_path)

print("Removing background using rembg...")
output_image = remove(input_image)

# Ensure public dir exists
os.makedirs("s:/sikap-mantup/public", exist_ok=True)
os.makedirs("s:/sikap-mantup/src/app", exist_ok=True)

print("Saving high-resolution transparent PNG...")
output_image.save(output_artifact, format="PNG")
output_image.save(public_logo, format="PNG")

# Generate 512x512
print("Generating 512x512 icon...")
icon512_img = output_image.resize((512, 512), Image.Resampling.LANCZOS)
icon512_img.save(icon_512, format="PNG")

# Generate 192x192
print("Generating 192x192 icon...")
icon192_img = output_image.resize((192, 192), Image.Resampling.LANCZOS)
icon192_img.save(icon_192, format="PNG")
icon192_img.save(app_icon, format="PNG")

print("SUCCESS! All transparent PNG logos and icons generated.")

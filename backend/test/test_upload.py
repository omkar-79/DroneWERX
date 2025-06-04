# test_upload.py

import os
import sys
import tkinter as tk
from tkinter import filedialog, messagebox
import requests

# Adjust this if your backend is not at localhost:8000
BACKEND_URL = "http://localhost:8000"


def pick_and_upload_file():
    # Create a hidden root window for tkinter
    root = tk.Tk()
    root.withdraw()

    # Pop up the file‐chooser dialog
    filepath = filedialog.askopenfilename(
        title="Select a file to upload",
        filetypes=[
            ("All files", "*.*"),
            ("Images", "*.png;*.jpg;*.jpeg;*.gif"),
            ("PDFs", "*.pdf"),
            ("Videos", "*.mp4;*.mov;*.avi"),
        ],
    )

    # If user cancels, filepath will be empty
    if not filepath:
        messagebox.showinfo("Cancelled", "No file selected. Exiting.")
        sys.exit(0)

    filename = os.path.basename(filepath)
    ext = os.path.splitext(filename)[1].lower()
    # Guess a content‐type based on extension
    content_type = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
    }.get(ext, "application/octet-stream")

    # Confirm with the user before uploading
    proceed = messagebox.askyesno(
        "Upload Confirmation",
        f"Upload file?\n\n{filename}\nSize: {os.path.getsize(filepath)} bytes\nMIME: {content_type}",
    )
    if not proceed:
        messagebox.showinfo("Cancelled", "Upload aborted by user.")
        sys.exit(0)

    # Perform the multipart/form‐data POST
    with open(filepath, "rb") as f:
        files = {"file": (filename, f, content_type)}
        try:
            resp = requests.post(f"{BACKEND_URL}/upload", files=files)
        except requests.ConnectionError as e:
            messagebox.showerror(
                "Connection Error", f"Could not connect to {BACKEND_URL}/upload\n{e}"
            )
            sys.exit(1)

    if resp.status_code not in (200, 201):
        messagebox.showerror(
            "Upload Failed", f"Server returned {resp.status_code}:\n{resp.text}"
        )
        sys.exit(1)

    data = resp.json()
    msg = (
        f"Upload succeeded!\n\n"
        f"ID: {data.get('id')}\n"
        f"Original_name: {data.get('original_name')}\n"
        f"Content_type: {data.get('content_type')}\n"
        f"Size_bytes: {data.get('size_bytes')}\n"
        f"Storage_path: {data.get('storage_path')}\n"
        f"Uploaded_at: {data.get('uploaded_at')}\n"
    )
    messagebox.showinfo("Upload Successful", msg)


if __name__ == "__main__":
    # Ensure requests is installed
    try:
        import requests  # noqa: F401
    except ImportError:
        print("Please install the requests library: pip install requests")
        sys.exit(1)

    pick_and_upload_file()

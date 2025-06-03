# Use Python 3.10
FROM python:3.10

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy only requirements.txt and install dependencies first
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy all your Python code into the container
COPY . .

# Add this line to make the directory a Python package
RUN touch __init__.py

# Expose port 8000 for FastAPI
EXPOSE 8000

# Update the command to use the module path
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
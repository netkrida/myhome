# Analytics API Testing Guide

## 📊 **CURL Commands untuk Analytics Dashboard**

### **🔐 1. Authentication Setup**

#### **Step 1: Get CSRF Token**
```bash
curl -X GET "http://localhost:3000/api/auth/csrf" \
  -H "Content-Type: application/json" \
  -c cookies.txt
```

#### **Step 2: Login dengan CSRF Token**
```bash
# Extract CSRF token dari response step 1
CSRF_TOKEN="your_csrf_token_here"

curl -X POST "http://localhost:3000/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b cookies.txt \
  -c cookies.txt \
  -d "email=superadmin@myhome.co.id&password=@superadmin@myhome.co5432&csrfToken=${CSRF_TOKEN}&callbackUrl=http://localhost:3000/dashboard"
```

#### **Step 3: Verify Session**
```bash
curl -X GET "http://localhost:3000/api/auth/session" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### **📈 2. Analytics Endpoints**

#### **A. Total Visitors - All Time**
```bash
curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=all" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -s | jq '.'
```

#### **B. Total Visitors - This Month (Dashboard Default)**
```bash
curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=month" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -s | jq '.'
```

#### **C. Total Visitors - This Week**
```bash
curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=week" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -s | jq '.'
```

#### **D. Total Visitors - Today**
```bash
curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=today" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -s | jq '.'
```

#### **E. Total Visitors - This Year**
```bash
curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=year" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -s | jq '.'
```

### **🎯 3. Expected Response Format**

```json
{
  "totalVisitors": 8,
  "period": "month",
  "dateRange": {
    "start": "2025-09-30T17:00:00.000Z",
    "end": "2025-10-03T22:00:28.410Z"
  },
  "countries": {
    "Indonesia": 4,
    "Singapore": 1,
    "Malaysia": 2,
    "Thailand": 1
  },
  "cities": {
    "Surabaya": 1,
    "Bandung": 1,
    "Singapore": 1,
    "Bangkok": 1,
    "Medan": 1,
    "Penang": 1,
    "Jakarta": 1,
    "Kuala Lumpur": 1
  },
  "devices": {
    "mobile": 2,
    "desktop": 5,
    "tablet": 1
  },
  "browsers": {
    "firefox": 1,
    "chrome": 5,
    "safari": 2
  },
  "operatingSystems": {
    "macos": 1,
    "windows": 3,
    "android": 1,
    "ios": 2,
    "linux": 1
  },
  "summary": {
    "totalVisitors": 8,
    "returningVisitors": 1,
    "newVisitors": 7,
    "totalPageViews": 26,
    "uniqueCountries": 4,
    "uniqueCities": 8,
    "uniqueDevices": 3,
    "uniqueBrowsers": 3,
    "uniqueOperatingSystems": 5
  }
}
```

### **🔧 4. Testing Scripts**

#### **Complete Test Script (Bash)**
```bash
#!/bin/bash

# Analytics API Testing Script
BASE_URL="http://localhost:3000"
COOKIES_FILE="cookies.txt"

echo "🔐 Step 1: Getting CSRF Token..."
CSRF_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/auth/csrf" \
  -H "Content-Type: application/json" \
  -c ${COOKIES_FILE})

CSRF_TOKEN=$(echo $CSRF_RESPONSE | jq -r '.csrfToken')
echo "✅ CSRF Token: ${CSRF_TOKEN}"

echo "🔐 Step 2: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -b ${COOKIES_FILE} \
  -c ${COOKIES_FILE} \
  -d "email=superadmin@myhome.co.id&password=@superadmin@myhome.co5432&csrfToken=${CSRF_TOKEN}&callbackUrl=${BASE_URL}/dashboard")

echo "✅ Login completed"

echo "🔐 Step 3: Verifying session..."
SESSION_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/auth/session" \
  -H "Content-Type: application/json" \
  -b ${COOKIES_FILE})

echo "✅ Session: $(echo $SESSION_RESPONSE | jq -r '.user.email')"

echo "📊 Step 4: Testing Analytics Endpoints..."

echo "📈 Testing Monthly Analytics (Dashboard Default):"
curl -s -X GET "${BASE_URL}/api/analytics/visitors/total?period=month" \
  -H "Content-Type: application/json" \
  -b ${COOKIES_FILE} | jq '.'

echo "📈 Testing All Time Analytics:"
curl -s -X GET "${BASE_URL}/api/analytics/visitors/total?period=all" \
  -H "Content-Type: application/json" \
  -b ${COOKIES_FILE} | jq '.summary'

echo "🧹 Cleanup..."
rm -f ${COOKIES_FILE}
echo "✅ Testing completed!"
```

#### **PowerShell Test Script**
```powershell
# Analytics API Testing Script (PowerShell)
$BaseUrl = "http://localhost:3000"
$CookiesFile = "cookies.txt"

Write-Host "🔐 Step 1: Getting CSRF Token..." -ForegroundColor Yellow
$CsrfResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/csrf" -Method Get -SessionVariable Session
$CsrfToken = $CsrfResponse.csrfToken
Write-Host "✅ CSRF Token: $CsrfToken" -ForegroundColor Green

Write-Host "🔐 Step 2: Logging in..." -ForegroundColor Yellow
$LoginBody = @{
    email = "superadmin@myhome.co.id"
    password = "password123"
    csrfToken = $CsrfToken
    callbackUrl = "$BaseUrl/dashboard"
}
$LoginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/callback/credentials" -Method Post -Body $LoginBody -WebSession $Session
Write-Host "✅ Login completed" -ForegroundColor Green

Write-Host "🔐 Step 3: Verifying session..." -ForegroundColor Yellow
$SessionResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/session" -Method Get -WebSession $Session
Write-Host "✅ Session: $($SessionResponse.user.email)" -ForegroundColor Green

Write-Host "📊 Step 4: Testing Analytics Endpoints..." -ForegroundColor Yellow

Write-Host "📈 Testing Monthly Analytics (Dashboard Default):" -ForegroundColor Cyan
$MonthlyAnalytics = Invoke-RestMethod -Uri "$BaseUrl/api/analytics/visitors/total?period=month" -Method Get -WebSession $Session
$MonthlyAnalytics | ConvertTo-Json -Depth 10

Write-Host "📈 Testing All Time Analytics Summary:" -ForegroundColor Cyan
$AllTimeAnalytics = Invoke-RestMethod -Uri "$BaseUrl/api/analytics/visitors/total?period=all" -Method Get -WebSession $Session
$AllTimeAnalytics.summary | ConvertTo-Json -Depth 10

Write-Host "✅ Testing completed!" -ForegroundColor Green
```

### **🌐 5. Browser Testing**

#### **Manual Browser Testing**
1. **Login**: Navigate ke `http://localhost:3000/login`
2. **Credentials**: 
   - Email: `superadmin@myhome.co.id`
   - Password: `password123`
3. **Dashboard**: Navigate ke `http://localhost:3000/dashboard/superadmin`
4. **Inspect**: Open Developer Tools → Network tab
5. **API Call**: Look for `/api/analytics/visitors/total?period=month`

#### **Browser Console Testing**
```javascript
// Test API call dari browser console
fetch('/api/analytics/visitors/total?period=month')
  .then(response => response.json())
  .then(data => {
    console.log('Analytics Data:', data);
    console.log('Countries:', data.countries);
    console.log('Devices:', data.devices);
    console.log('Summary:', data.summary);
  })
  .catch(error => console.error('Error:', error));
```

### **🔍 6. Debugging & Troubleshooting**

#### **Common Issues**

1. **403 Forbidden**
   ```bash
   # Check authentication
   curl -X GET "http://localhost:3000/api/auth/session" \
     -H "Content-Type: application/json" \
     -b cookies.txt
   ```

2. **Empty Response**
   ```bash
   # Check if data exists
   curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=all" \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -v
   ```

3. **CORS Issues**
   ```bash
   # Add origin header
   curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=month" \
     -H "Content-Type: application/json" \
     -H "Origin: http://localhost:3000" \
     -b cookies.txt
   ```

#### **Debug Headers**
```bash
# Verbose output untuk debugging
curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=month" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v \
  -w "\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n"
```

### **📊 7. Data Validation**

#### **Validate Response Structure**
```bash
# Check required fields
curl -s -X GET "http://localhost:3000/api/analytics/visitors/total?period=month" \
  -H "Content-Type: application/json" \
  -b cookies.txt | jq 'has("totalVisitors") and has("countries") and has("devices") and has("summary")'
```

#### **Validate Data Types**
```bash
# Check data types
curl -s -X GET "http://localhost:3000/api/analytics/visitors/total?period=month" \
  -H "Content-Type: application/json" \
  -b cookies.txt | jq 'type'
```

### **⚡ 8. Performance Testing**

#### **Response Time Test**
```bash
# Measure response time
time curl -s -X GET "http://localhost:3000/api/analytics/visitors/total?period=month" \
  -H "Content-Type: application/json" \
  -b cookies.txt > /dev/null
```

#### **Load Testing (Simple)**
```bash
# Multiple concurrent requests
for i in {1..10}; do
  curl -s -X GET "http://localhost:3000/api/analytics/visitors/total?period=month" \
    -H "Content-Type: application/json" \
    -b cookies.txt &
done
wait
```

### **📝 9. Notes**

- **Authentication**: Required SUPERADMIN role
- **Rate Limiting**: No rate limiting implemented
- **Caching**: No caching implemented (real-time data)
- **Data Source**: PostgreSQL database via Prisma
- **Response Time**: ~100-500ms depending on data size
- **Browser Support**: Modern browsers dengan WebGL support untuk globe

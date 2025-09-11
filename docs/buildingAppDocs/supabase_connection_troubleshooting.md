# Supabase Connection Troubleshooting Guide

## 🚨 "Failed to fetch" Error

This error occurs when your frontend application cannot reach the Supabase backend. Here's how to diagnose and fix it.

## 🔍 **Step 1: Check Environment Variables**

### **Verify in `.env.local`:**
```bash
# Check if these are set correctly
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### **Verify in Supabase Dashboard:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the correct values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🌐 **Step 2: Check Network Connectivity**

### **Test Supabase URL:**
```bash
# Test if Supabase is reachable
curl -I https://your-project.supabase.co

# Should return HTTP 200 or 301/302
```

### **Check Browser Network Tab:**
1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for failed requests to Supabase
5. Check the **Status** and **Response** columns

## 🔧 **Step 3: Common Issues & Solutions**

### **Issue 1: Environment Variables Not Loaded**
```bash
# Restart your development server
npm run dev
# or
yarn dev
```

### **Issue 2: Supabase Project Paused/Deleted**
- Check if your Supabase project is active
- Verify project hasn't been deleted
- Check billing status

### **Issue 3: CORS Issues**
- Supabase handles CORS automatically
- If you see CORS errors, check your Supabase project settings

### **Issue 4: Network/Firewall Blocking**
- Check if your network blocks external API calls
- Try from different network (mobile hotspot)
- Check corporate firewall settings

## 🧪 **Step 4: Test Database Connection**

### **Run Connection Test:**
```sql
-- Copy and run in Supabase SQL Editor:
-- scripts/check_supabase_connection.sql
```

### **Expected Results:**
- ✅ "Database connection successful!"
- ✅ Table record counts
- ✅ "Supabase database is working correctly!"

## 🚀 **Step 5: Frontend Debugging**

### **Check Supabase Client:**
```typescript
// In your browser console, check:
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Test basic connection
const { data, error } = await supabase.from('members').select('count');
console.log('Test query result:', { data, error });
```

### **Check for JavaScript Errors:**
1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Look for any JavaScript errors
4. Check for network-related errors

## 🔄 **Step 6: Reset & Restart**

### **Clear Browser Cache:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache and cookies
3. Try incognito/private browsing mode

### **Restart Development Server:**
```bash
# Stop the server (Ctrl+C)
# Clear Next.js cache
rm -rf .next
# Restart
npm run dev
```

## 📱 **Step 7: Test Different Scenarios**

### **Test 1: Basic Page Load**
- Does the page load without JavaScript errors?
- Are environment variables visible in console?

### **Test 2: Authentication**
- Can you log in/log out?
- Are auth tokens being generated?

### **Test 3: Database Queries**
- Can you fetch basic data?
- Are RPC calls working?

## 🆘 **Step 8: Get Help**

### **If Still Not Working:**
1. **Check Supabase Status**: [status.supabase.com](https://status.supabase.com)
2. **Supabase Discord**: [discord.gg/supabase](https://discord.gg/supabase)
3. **GitHub Issues**: [github.com/supabase/supabase](https://github.com/supabase/supabase)

### **Information to Provide:**
- Error message and stack trace
- Environment variables (without actual keys)
- Browser and OS version
- Network environment (home/office/public)
- Supabase project region

## ✅ **Quick Fix Checklist**

- [ ] Environment variables are correct
- [ ] Development server restarted
- [ ] Browser cache cleared
- [ ] Network connectivity verified
- [ ] Supabase project is active
- [ ] No JavaScript errors in console
- [ ] Database connection test passed

## 🎯 **Most Common Solution**

**90% of the time, this error is caused by:**
1. **Incorrect environment variables**
2. **Development server needs restart**
3. **Supabase project is paused/deleted**

**Try this first:**
```bash
# 1. Verify .env.local has correct values
# 2. Restart development server
npm run dev
# 3. Hard refresh browser (Ctrl+Shift+R)
```

---

**Need more help?** Check the Supabase Discord or create a GitHub issue with the details above! 🚀

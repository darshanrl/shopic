# ShoPic Admin Guide

## 🔧 Admin Photo/Video Management

### How to Remove Uploaded Photos and Videos

As an admin, you can remove inappropriate or unwanted photos and videos through multiple methods:

#### Method 1: Direct Database Access (Recommended for Bulk Operations)

1. **Access Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to "Table Editor"
   - Select the `entries` table

2. **Find and Delete Entries:**
   - Use filters to find specific entries:
     - Filter by `contest_id` to see entries for specific contests
     - Filter by `user_id` to see entries from specific users
     - Filter by `created_at` to find entries by date
   - Select the entry row(s) you want to delete
   - Click the delete button (trash icon)
   - Confirm deletion

3. **Clean Up Storage Files:**
   - Go to "Storage" in Supabase dashboard
   - Navigate to the `contest-entries` bucket
   - Find the corresponding image/video files
   - Delete the files manually

#### Method 2: Using Entry Entity (For Developers)

The Entry entity has a delete method available:

```javascript
import { Entry } from '@/entities/Entry';

// Delete a specific entry by ID
await Entry.delete(entryId);
```

#### Method 3: Add Admin Panel (Future Enhancement)

Currently, there's no admin panel in the UI. You can add one by:

1. Creating an admin entries management page
2. Using the existing `useAdmin` hook to check admin status
3. Implementing delete functionality with proper confirmation dialogs

### Current Admin Features Available

1. **Winners Management** (`/winners` page):
   - Select contest winners
   - Upload certificates for winners
   - Edit/delete winner selections

2. **Admin Authentication**:
   - Admin status is stored in `users.is_admin` field
   - Use `useAdmin` hook to check admin permissions
   - Protected routes with `AdminRoute` component

### Setting Up Admin Users

1. **In Supabase Dashboard:**
   - Go to Table Editor → `users` table
   - Find the user you want to make admin
   - Set `is_admin` field to `true`

2. **Using SQL:**
   ```sql
   UPDATE users 
   SET is_admin = true 
   WHERE email = 'admin@example.com';
   ```

## 📋 Entry Management Best Practices

1. **Before Deleting Entries:**
   - Review the content to ensure it violates guidelines
   - Consider warning the user first
   - Document the reason for removal

2. **Storage Cleanup:**
   - Always delete both database entry AND storage files
   - Storage files are in `contest-entries` bucket
   - File names typically match the entry ID or contain user/contest info

3. **User Communication:**
   - Consider notifying users when their content is removed
   - Provide clear guidelines for acceptable content

## 🚀 Future Admin Features to Implement

1. **Admin Dashboard Page**
2. **Bulk Entry Management**
3. **Content Moderation Tools**
4. **User Management Panel**
5. **Analytics and Reporting**

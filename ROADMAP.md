# My2Light Mobile - Roadmap v2.0

> Kế hoạch triển khai App Store và mở rộng quy mô

---

## 📋 Phase 1: App Store Preparation (Tuần 1-2)

### 1.1 Apple Developer Account
- [ ] Đăng ký Apple Developer Program ($99/năm)
- [ ] Tạo App ID và Bundle Identifier: `com.my2light.app`
- [ ] Tạo Distribution Certificate
- [ ] Tạo Provisioning Profile

### 1.2 App Store Assets
- [ ] **App Icon** (1024x1024px)
- [ ] **Screenshots** (6.7", 6.5", 5.5" iPhone)
- [ ] **App Preview Video** (15-30 giây)
- [ ] **Privacy Policy URL**
- [ ] **Support URL**
- [ ] **App Description** (4000 ký tự)
- [ ] **Keywords** (100 ký tự)

### 1.3 App Configuration
```json
// app.json updates
{
  "expo": {
    "name": "My2Light",
    "slug": "my2light",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "my2light",
    "ios": {
      "bundleIdentifier": "com.my2light.app",
      "supportsTablet": false,
      "infoPlist": {
        "NSCameraUsageDescription": "Quay video trận đấu",
        "NSMicrophoneUsageDescription": "Ghi âm khi quay video",
        "NSPhotoLibraryUsageDescription": "Lưu video vào thư viện"
      }
    }
  }
}
```

---

## 🏗️ Phase 2: Production Build (Tuần 2-3)

### 2.1 Build with EAS
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Create production build
eas build --platform ios --profile production
```

### 2.2 EAS Configuration
```json
// eas.json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "APP_STORE_CONNECT_APP_ID"
      }
    }
  }
}
```

### 2.3 TestFlight Beta
- [ ] Upload build to App Store Connect
- [ ] Internal testing (team)
- [ ] External testing (100 beta users)
- [ ] Collect feedback and fix bugs

---

## 🔧 Phase 3: Missing Features (Tuần 3-4)

### 3.1 Video Features
- [ ] **Highlight Marking** - Đánh dấu highlight khi quay
- [ ] **Video Trimming** - Cắt video trước khi upload
- [ ] **Background Upload** - Upload ngầm khi tắt app
- [ ] **Upload Progress** - Hiển thị tiến trình upload

### 3.2 Match System
- [ ] **Match Chat** - Nhắn tin với đối thủ
- [ ] **Match History** - Lịch sử đấu
- [ ] **Rating System** - Đánh giá đối thủ

### 3.3 Social Features
- [ ] **Comments** - Bình luận video
- [ ] **Follow System** - Theo dõi người chơi
- [ ] **Share to Social** - Chia sẻ lên mạng xã hội

### 3.4 Court Features
- [ ] **Court Detail** - Chi tiết sân
- [ ] **Court Booking** - Đặt sân online
- [ ] **Court Review** - Đánh giá sân

---

## 📈 Phase 4: Scalability (Tuần 5-8)

### 4.1 Backend Optimization

#### Supabase Configuration
```sql
-- Enable RLS for all tables
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

-- Add indexes for frequent queries
CREATE INDEX idx_highlights_user ON highlights(user_id);
CREATE INDEX idx_highlights_created ON highlights(created_at DESC);
CREATE INDEX idx_match_requests_status ON match_requests(status);
```

#### Edge Functions
```typescript
// Video processing with Deno
// supabase/functions/process-video/index.ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  // Thumbnail generation
  // Video compression
  // AI highlight detection
});
```

### 4.2 CDN & Storage
- [ ] **Cloudinary** cho video processing
- [ ] **Supabase Storage** với CDN
- [ ] **Video compression** trước upload

### 4.3 Push Notifications
```bash
# Install expo-notifications
npx expo install expo-notifications

# Configure APNs in Apple Developer
# Upload .p8 key to Expo
```

### 4.4 Analytics
- [ ] **Expo Insights** - User analytics
- [ ] **Sentry** - Error tracking
- [ ] **Firebase Analytics** - Event tracking

---

## 🔒 Phase 5: Security & Compliance

### 5.1 Data Privacy
- [ ] GDPR compliance
- [ ] Chính sách bảo mật
- [ ] Chính sách xóa dữ liệu
- [ ] Export dữ liệu người dùng

### 5.2 App Security
- [ ] Certificate pinning
- [ ] Secure storage cho tokens
- [ ] Rate limiting
- [ ] Input validation

### 5.3 Content Moderation
- [ ] Report system
- [ ] Content filtering
- [ ] User blocking

---

## 💰 Phase 6: Monetization (Optional)

### 6.1 In-App Purchases
- [ ] Pro subscription (extended recording)
- [ ] Credit packages
- [ ] Premium features

### 6.2 Revenue Model
| Tier | Price | Features |
|------|-------|----------|
| Free | 0đ | 5 videos/month, 2 min max |
| Pro | 99k/month | Unlimited videos, 10 min max |
| Elite | 199k/month | All features, AI highlights |

---

## 📊 Phase 7: Performance Targets

### User Capacity
| Metric | Target |
|--------|--------|
| Concurrent Users | 10,000+ |
| Daily Active Users | 5,000+ |
| Video Uploads/day | 1,000+ |
| Response Time | <200ms |
| Crash-free Rate | 99.5%+ |

### Infrastructure
- Supabase Pro Plan ($25/mo) for 100k MAU
- Cloudinary (10GB/mo free, then $99/mo)
- Push notifications via Expo (included)

---

## 📅 Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| 1. App Store Prep | Tuần 1-2 | 🔜 Next |
| 2. Production Build | Tuần 2-3 | Pending |
| 3. Missing Features | Tuần 3-4 | Pending |
| 4. Scalability | Tuần 5-8 | Pending |
| 5. Security | Tuần 8-10 | Pending |
| 6. Monetization | Tuần 10-12 | Optional |

---

## 🎯 Immediate Next Steps

1. **Đăng ký Apple Developer** ($99)
2. **Tạo app icon và screenshots**
3. **Build TestFlight beta**
4. **Internal testing**
5. **Submit lên App Store**

**Estimated Time to App Store: 3-4 tuần**

const WEDDING_LANGUAGE_STORAGE_KEY = 'wedding-language';
const WEDDING_LANGUAGES = ['zh-TW', 'en'];

const translations = {
  'zh-TW': {
    meta: { title: '子靖 ＆ 勤萱｜婚禮邀請' },
    nav: {
      openMenu: '開啟選單', closeMenu: '關閉選單', main: '主要導覽',
      languageGroup: '選擇語言', chooseChinese: '切換為繁體中文', chooseEnglish: 'Switch to English'
    },
    accessibility: { backToTop: '回到頁面頂端', readingProgress: '頁面閱讀進度' },
    hero: {
      weddingSchedule: '婚禮｜14:00', banquetSchedule: '婚宴｜18:00',
      ceremonyEntry: '開放入場', onlineEntry: '線上開放進入', scheduleLabel: '邀請行程'
    },
    countdown: {
      before: '距離我們的婚禮還有 {days} 天', today: '今天，我們結婚了。', after: '謝謝您與我們一起見證這一天。'
    },
    online: {
      enter: '進入線上婚禮', unavailable: '線上參加連結將於婚禮前提供'
    },
    rsvp: {
      modeTitle: { wedding: '婚禮出席回覆', full: '婚禮與婚宴出席回覆', online: '線上參加回覆' },
      expand: '立即回覆', collapse: '收起回覆表單', submit: '送出回覆', submitting: '正在送出⋯',
      submittedTitle: '您已完成出席回覆', createdTitle: '✔ 回覆已送出', updatedTitle: '✔ 回覆已更新',
      received: '我們已收到您的出席資訊。<br>期待與您一起分享這個重要的日子。',
      createdMessage: '期待與您一起分享這個重要的日子。',
      updatedMessage: '您的最新回覆已成功儲存，<br>已取代先前資料。',
      onlineSuccess: '我們已為您登記線上參加婚禮。<br>正式連結將於婚禮前透過原邀請訊息提供，<br>請於婚禮前再次查看 LINE 訊息。',
      nameRequired: '請輸入您的姓名。', phoneRequired: '請輸入您的聯絡電話。',
      phoneInvalid: '請輸入至少 8 位數字的聯絡電話。', attendanceRequired: '請選擇您的出席狀況。',
      vegetarianInvalid: '素食人數不得超過出席人數。', submitFailed: '目前無法送出，請稍後再試。',
      statusTimeout: '目前無法確認回覆是否成功送達。\n請稍後查看或重新整理後再試一次。'
    },
    seating: {
      date: '2026 年 12 月 19 日', deadline: '2026 年 11 月 1 日',
      loading: '查詢中...', lookup: '查詢座位', welcome: '歡迎蒞臨', closing: '期待與您共度美好時光',
      table: '{table} 桌', guests: '{guests}賓客', specialMeal: '※ 已安排{meal}',
      regularMeal: '一般餐', vegetarianMeal: '素食',
      notFoundTitle: '很抱歉', notFound: '目前找不到您的座位資訊。<br>請確認姓名是否與喜帖相同，<br>或向現場接待人員詢問。'
    },
    gallery: {
      region: '婚紗相簿', carouselRole: '輪播', slideRole: '投影片',
      slideLabel: '第 {current} 張，共 {total} 張', openPhoto: '開啟婚紗相簿第 {current} 張照片',
      viewPhoto: '查看第 {current} 張婚紗照', previous: '上一張婚紗照', next: '下一張婚紗照',
      returnFirst: '返回第一張照片', lightbox: '婚紗相簿燈箱', close: '關閉相簿',
      previousPhoto: '上一張照片', nextPhoto: '下一張照片', counter: '{current} / {total}',
      imageAlt: [
        '子靖向勤萱獻上戒指的婚紗照', '子靖與勤萱牽手歡笑的婚紗照', '子靖向勤萱求婚的全身婚紗照',
        '子靖與勤萱手捧紅玫瑰的婚紗照', '子靖與勤萱並肩端坐的婚紗照', '子靖陪勤萱閱讀的婚紗照',
        '勤萱展示白色婚紗背影的婚紗照', '子靖穿著淺色西裝的個人婚紗照', '子靖與勤萱在深色背景前相依的婚紗照',
        '子靖與勤萱穿著黑色禮服與紅色禮服互贈花束的婚紗照', '子靖牽著穿紅色禮服的勤萱的婚紗照'
      ]
    }
  },
  en: {
    meta: { title: 'Zeric & Lily | Wedding Invitation' },
    nav: {
      openMenu: 'Open menu', closeMenu: 'Close menu', main: 'Main navigation',
      languageGroup: 'Choose language', chooseChinese: 'Switch to Traditional Chinese', chooseEnglish: 'Switch to English'
    },
    accessibility: { backToTop: 'Back to top', readingProgress: 'Page reading progress' },
    hero: {
      weddingSchedule: 'Wedding Ceremony | 2:00 PM', banquetSchedule: 'Wedding Banquet | 6:00 PM',
      ceremonyEntry: 'Admission Opens', onlineEntry: 'Online Room Opens', scheduleLabel: 'Invitation schedule'
    },
    countdown: {
      before: '{days} {unit} until our wedding', today: 'Today, we are getting married.', after: 'Thank you for sharing this special day with us.',
      day: 'day', days: 'days'
    },
    online: {
      enter: 'Join the Online Wedding', unavailable: 'The online link will be shared before the wedding'
    },
    rsvp: {
      modeTitle: { wedding: 'Wedding Ceremony RSVP', full: 'Ceremony & Banquet RSVP', online: 'Online Wedding RSVP' },
      expand: 'RSVP Now', collapse: 'Close RSVP Form', submit: 'Submit RSVP', submitting: 'Submitting…',
      submittedTitle: 'RSVP Already Submitted', createdTitle: '✔ RSVP Submitted', updatedTitle: '✔ RSVP Updated',
      received: 'We have received your RSVP.<br>We look forward to sharing this special day with you.',
      createdMessage: 'We look forward to sharing this special day with you.',
      updatedMessage: 'Your latest RSVP has been saved<br>and has replaced your previous response.',
      onlineSuccess: 'We have registered your online attendance.<br>The official link will be sent through the original invitation message before the wedding.<br>Please check your LINE messages again before the ceremony.',
      nameRequired: 'Please enter your name.', phoneRequired: 'Please enter your phone number.',
      phoneInvalid: 'Please enter a phone number with at least 8 digits.', attendanceRequired: 'Please select an attendance option.',
      vegetarianInvalid: 'Vegetarian meals cannot exceed the number of guests.', submitFailed: 'We are unable to submit your RSVP right now. Please try again later.',
      statusTimeout: 'We could not confirm whether your RSVP was received.\nPlease check again later or refresh the page and try again.'
    },
    seating: {
      date: 'December 19, 2026', deadline: 'November 1, 2026',
      loading: 'Searching…', lookup: 'Look Up My Table', welcome: 'Welcome', closing: 'We look forward to celebrating with you',
      table: 'Table {table}', guests: '{guests} guests', specialMeal: '※ {meal} arranged',
      regularMeal: 'regular meals', vegetarianMeal: 'vegetarian meals',
      notFoundTitle: 'We’re sorry', notFound: 'We could not find your table information.<br>Please make sure the name matches your invitation,<br>or ask our reception team for assistance.'
    },
    gallery: {
      region: 'Wedding Gallery', carouselRole: 'carousel', slideRole: 'slide',
      slideLabel: 'Photo {current} of {total}', openPhoto: 'Open wedding gallery photo {current}',
      viewPhoto: 'View wedding photo {current}', previous: 'Previous wedding photo', next: 'Next wedding photo',
      returnFirst: 'Return to first photo', lightbox: 'Wedding gallery lightbox', close: 'Close gallery',
      previousPhoto: 'Previous photo', nextPhoto: 'Next photo', counter: 'Photo {current} of {total}',
      imageAlt: [
        'Zeric offering a ring to Lily', 'Zeric and Lily laughing while holding hands', 'Zeric proposing to Lily',
        'Zeric and Lily holding a bouquet of red roses', 'Zeric and Lily seated together in wedding attire', 'Zeric watching Lily read by the window',
        'Lily showing the back of her white wedding gown', 'Portrait of Zeric in a light-colored suit', 'Zeric and Lily posing together against a dark backdrop',
        'Zeric and Lily exchanging a bouquet in black and red formalwear', 'Zeric holding hands with Lily in a red gown'
      ]
    }
  }
};

const englishPhrases = {
  '子靖': 'Zeric', '勤萱': 'Lily', '＆': '&',
  '謝謝您接受我們的邀請': 'Thank you for accepting our invitation',
  '請使用邀請訊息中的專屬連結': 'Please use the personal link in your invitation message',
  '查看本次婚禮資訊。': 'to view the wedding details.', '我已有邀請連結': 'I Have an Invitation Link',
  '開啟專屬邀請': 'Open Your Personal Invitation', '請由 LINE 或邀請訊息中的專屬網址開啟本網站。': 'Please open this website using the personal link in your LINE or invitation message.',
  '知道了': 'Got It', '跳至婚禮資訊': 'Skip to wedding information',
  '出席回覆': 'RSVP', '婚禮資訊': 'Wedding Ceremony', '婚宴資訊': 'Wedding Banquet', '座位查詢': 'Table Lookup',
  '婚紗相簿': 'Wedding Gallery', '更多': 'More', '婚禮停車': 'Ceremony Parking', '交通': 'Directions', '婚宴停車': 'Banquet Parking',
  '照片分享': 'Photo Sharing', '常見問題': 'FAQ', '誠摯邀請您': 'You’re Warmly Invited', '往下滑': 'Scroll Down',
  '給親愛的家人': 'To Our Dear Family', '與朋友': '& Friends',
  '謝謝您願意在百忙之中，': 'Thank you for making time in your busy lives', '與我們一起迎接人生的重要時刻。': 'to share this important moment with us.',
  '一路走來，': 'Along the way,', '因為有家人與朋友的陪伴和支持，': 'the love and support of our family and friends', '我們才能一步一步走到今天。': 'have helped us reach this day.',
  '這一天，': 'On this day,', '我們最期待的不是盛大的婚禮，': 'what we look forward to most is not a grand celebration,',
  '而是能與最重要的人，': 'but the chance to be with the people who mean the most to us', '一起分享這份喜悅。': 'and share this joy together.',
  '期待在 2026 年 12 月 26 日，': 'We look forward to seeing you', '與您相見。': 'on December 26, 2026.',
  '我們誠摯期待您的蒞臨。': 'We sincerely hope you can join us.', '為了讓我們能更完善地安排，': 'To help us prepare for the day,', '請花約 30 秒完成出席回覆。': 'please take about 30 seconds to complete your RSVP.',
  '請於': 'Please respond by', '前完成回覆。': '.', '回覆後仍可使用相同姓名與聯絡電話更新資料。': 'You may update your response later using the same name and phone number.',
  '立即回覆': 'RSVP Now', '您的出席，是我們收到最珍貴的禮物。': 'Your presence is the most precious gift we could receive.',
  '姓名': 'Name', '聯絡電話': 'Phone Number', '僅供新人確認與更新您的出席回覆使用。': 'Used only by the couple to confirm and update your RSVP.',
  '是否參加婚禮？': 'Will you attend the wedding ceremony?', '現場參加': 'Attending in Person', '線上參加': 'Attending Online', '無法參加': 'Unable to Attend',
  '是否參加婚宴？': 'Will you attend the wedding banquet?', '可以參加': 'Attending', '尚未確定': 'Not Sure Yet',
  '是否預計線上參加婚禮？': 'Will you attend the wedding online?', '會參加': 'Attending Online',
  '出席人數': 'Number of Guests', '最多 10 位': 'Maximum 10 guests', '素食人數': 'Vegetarian Meals', '不超過出席人數': 'Cannot exceed total guests',
  '備註': 'Notes', '留下一句想對我們說的話': 'Message for the Couple',
  '婚禮後，我們會將大家留下的祝福整理成紀念影片。': 'After the wedding, we may include your messages in a keepsake video.', '謝謝您送給我們最珍貴的一句話。': 'Thank you for leaving us a message to treasure.',
  '送出回覆': 'Submit RSVP', '謝謝您的回覆': 'Thank You for Your RSVP',
  '使用相同的姓名與聯絡電話再次送出，': 'Submit again with the same name and phone number', '系統會更新您原本的回覆。': 'to update your previous response.',
  '若想再次確認或需要協助，': 'If you would like to confirm your response or need help,', '請透過原邀請的 LINE 訊息聯絡我們。': 'please contact us through the original LINE invitation message.',
  '進入線上婚禮': 'Join the Online Wedding', '修改回覆': 'Edit RSVP',
  '一個小提醒': 'A Gentle Reminder', '您願意來到現場，': 'Your presence with us,', '與我們一起見證這個重要的時刻，': 'sharing and witnessing this meaningful moment,',
  '就是我們最珍貴的禮物。': 'is the most precious gift we could receive.', '本次婚禮不收禮金，': 'Please do not prepare a monetary gift.',
  '請帶著輕鬆的心情前來，': 'Simply come with a light heart', '和我們一起分享這份喜悅。': 'and celebrate this joy with us.',
  '婚禮日期': 'Ceremony Date', '婚宴日期': 'Banquet Date', '開放入場': 'Admission Opens', '婚禮開始': 'Ceremony Begins', '宴席開始': 'Banquet Begins',
  '耶和華見證人王國聚會所': 'Kingdom Hall of Jehovah’s Witnesses', '竹東會眾': 'Zhudong Congregation',
  '新竹縣竹東鎮': 'Zhudong Township, Hsinchu County', '長春路三段 376 號 2 樓': '2F, No. 376, Sec. 3, Changchun Rd.',
  '開啟婚禮場地導航': 'Open Ceremony Venue Directions', '線上參加婚禮': 'Attend the Wedding Online', '線上婚禮': 'Online Wedding',
  '線上大合照': 'Online Group Photo', '歡迎開啟鏡頭，一起留下美好的紀念。': 'You’re welcome to turn on your camera and help us capture this special memory.',
  '正式線上連結將於婚禮前透過原邀請訊息提供。': 'The official online link will be shared through the original invitation message before the wedding.',
  '線上參加連結將於婚禮前提供': 'The online link will be shared before the wedding',
  '婚禮場地停車': 'Ceremony Parking', '婚禮場地附近提供數個可停車位置，': 'Several parking options are available near the ceremony venue.',
  '建議提前抵達並依現場交通標誌停放。': 'Please arrive early and follow all posted parking signs.',
  '中興路一段路邊停車': 'Roadside Parking on Sec. 1, Zhongxing Rd.', '步行約 1-5 分鐘': 'About a 1–5 minute walk',
  '位於聚會所旁邊的中興路一段沿線，': 'Parking is available along Sec. 1, Zhongxing Rd. beside the Kingdom Hall.', '請依現場交通標誌與道路規定停放。': 'Please follow posted signs and local parking regulations.',
  'Google Maps 導航': 'Open in Google Maps', '聚會所對面巷內停車': 'Parking in the Lane Opposite the Kingdom Hall', '步行約 2-4 分鐘': 'About a 2–4 minute walk',
  '位於聚會所對面的巷子內，': 'This parking area is located in the lane opposite the Kingdom Hall.', '請依現場交通標誌與可停放範圍停車。': 'Please park only where permitted by posted signs.',
  '鄰近停車位置': 'Nearby Parking Option', '步行約 3-5 分鐘': 'About a 3–5 minute walk', '距離婚禮場地步行約 3-5 分鐘，': 'This parking option is about a 3–5 minute walk from the ceremony venue.',
  '可依現場交通狀況自由選擇停放。': 'Please choose a suitable space according to current traffic conditions.', '請依現場交通標誌與道路規定停放，': 'Please follow posted signs and local parking regulations.', '勿停於紅線、出入口或妨礙通行的位置。': 'Do not park along red lines, in front of entrances, or where you may block traffic.',
  '婚禮注意事項': 'Before You Arrive', '預留抵達時間': 'Allow Time to Arrive', '婚禮將於 14:00 開始，建議預留交通與入場時間。': 'The ceremony begins at 2:00 PM. Please allow enough time for travel and admission.',
  '依': 'Follow the ', '現場': 'On-site', '引導入場': ' Guidance', '抵達聚會所後，請依現場接待人員指引前往 2 樓。': 'After arriving at the Kingdom Hall, please follow our reception team’s directions to the second floor.',
  '準時入席': 'Please Be Seated on Time', '13:30 開放入場，期待與您一同見證這個重要時刻。': 'Admission opens at 1:30 PM. We look forward to sharing this meaningful moment with you.',
  '晶宴會館－御豐館': 'Amazing Hall — Yufeng Venue', '2F｜星辰劇場': '2F, Star Theater', '300 新竹市東區公道五路三段 1 號 2 樓': '2F, No. 1, Sec. 3, Gongdao 5th Rd., East Dist., Hsinchu City',
  '交通與抵達': 'Directions & Arrival', '建議提前': 'We recommend arriving', '20～30 分鐘': '20–30 minutes ', '抵達，預留停車、報到與入座時間。': 'early to allow time for parking, check-in, and seating.',
  '開啟會館導航': 'Open Venue Directions', '前往 2F 星辰劇場': 'Proceed to the Star Theater on 2F', '抵達會館後，請依現場指示搭乘電梯前往 2 樓。': 'After arriving, please follow the signs and take the elevator to the second floor.',
  '婚宴場地為星辰劇場。': 'The banquet will be held in the Star Theater.', '停車資訊': 'Banquet Parking', '會館備有地下與戶外停車空間。': 'Indoor and outdoor parking are available at the venue.',
  '推薦': 'Recommended', '地下停車場': 'Underground Parking', '建議優先停放地下停車場，可直接搭乘電梯前往 2 樓星辰劇場。': 'We recommend using the underground parking area, which offers direct elevator access to the Star Theater on 2F.',
  '婚宴期間服務人員會到桌邊協助辦理停車消磁，無需自行處理。': 'During the banquet, staff will visit your table to validate your parking ticket.',
  '開啟導航': 'Open Directions', '戶外平面停車場': 'Outdoor Parking', '車位較多，步行約 2～3 分鐘即可抵達會館。': 'More spaces are available here, about a 2–3 minute walk from the venue.',
  '離場前請至櫃檯報車號，由工作人員協助辦理停車消磁。': 'Before leaving, please provide your license plate number at the front desk for parking validation.',
  '歡迎蒞臨我們的婚禮': 'Welcome to our wedding', '請輸入您的姓名即可快速查詢桌位。': 'Enter your name to look up your table.', '座位查詢尚未開放': 'Table Lookup Is Not Yet Available',
  '座位資訊將於': 'Table information will be available on', '開放查詢。': '.', '賓客姓名': 'Guest Name', '請先輸入姓名。': 'Please enter your name first.', '查詢座位': 'Look Up My Table',
  '每一張照片，都記錄著我們一路走來的點滴。': 'Each photograph holds a piece of the journey that brought us here.',
  '分享婚宴中的美好時刻': 'Share Your Favorite Banquet Moments', '如果您在婚宴當天拍下了照片或影片，': 'If you capture photos or videos during the banquet,',
  '歡迎上傳到我們的共同相簿，': 'we invite you to add them to our shared album', '一起收藏這份珍貴回憶。': 'and help us preserve these precious memories.',
  '開啟共同相簿': 'Open Shared Album', '登入 Google 帳號': 'Sign in to your Google account', '選擇照片或影片並新增': 'Select and add photos or videos',
  '上傳照片時需要登入 Google 帳號。': 'A Google account is required to upload photos.', '進入相簿後，請點選「新增相片」或「加入相簿」即可分享。': 'In the album, select “Add photos” or “Join album” to share your images.',
  '婚禮幾點開放入場？': 'What time does ceremony admission begin?', '13:30 開放入場，婚禮將於 14:00 開始，建議預留交通與入場時間。': 'Admission opens at 1:30 PM and the ceremony begins at 2:00 PM. Please allow enough time for travel and entry.',
  '婚禮場地位於哪裡？': 'Where is the ceremony venue?', '婚禮位於耶和華見證人王國聚會所－竹東會眾，會場在 2 樓。': 'The ceremony will be held on the second floor of the Kingdom Hall of Jehovah’s Witnesses — Zhudong Congregation.',
  '這次婚禮會收禮金嗎？': 'Should I prepare a monetary gift?', '您願意與我們一起見證這個重要的時刻，': 'Your presence and warm wishes are the greatest gifts to us.', '本次婚禮不收禮金，': 'Please do not prepare a monetary gift.', '請帶著輕鬆的心情前來。': 'Please come and celebrate with a light heart.',
  '需要在什麼時候前完成出席回覆？': 'When should I submit my RSVP?', '若出席狀況有變，': 'If your plans change,', '可使用相同姓名與聯絡電話再次提交，': 'submit again using the same name and phone number,', '系統會更新原本的回覆。': 'and the system will update your previous response.',
  '婚宴幾點開始？': 'What time does the banquet begin?', '17:00 開放入場，宴席將於 18:00 正式開始。': 'Banquet admission opens at 5:00 PM and dinner begins at 6:00 PM.',
  '婚宴停車如何辦理消磁？': 'How do I validate banquet parking?', '地下停車場由服務人員至桌邊協助；戶外停車場請於離場前至櫃檯報車號。': 'Staff will assist with underground parking validation at your table. For outdoor parking, provide your license plate number at the front desk before leaving.',
  '2026.12.26 · 新竹': 'December 26, 2026 · Hsinchu'
};

const englishAttributes = {
  '子靖與勤萱的婚紗照': 'Wedding portrait of Zeric and Lily', '子靖與勤萱婚紗照': 'Wedding portrait of Zeric and Lily', '子靖與勤萱': 'Zeric and Lily',
  '子靖與勤萱，回到首頁': 'Zeric and Lily, back to home', '邀請行程': 'Invitation schedule',
  '主要導覽': 'Main navigation', '開啟選單': 'Open menu', '線上婚禮時間': 'Online wedding schedule',
  '查看中興路一段路邊停車位置': 'View roadside parking on Sec. 1, Zhongxing Rd.', '查看聚會所對面巷內停車位置': 'View parking in the lane opposite the Kingdom Hall',
  '查看步行約三分鐘的停車位置': 'View the nearby parking option', '中興路一段路邊停車位置': 'Roadside parking on Sec. 1, Zhongxing Rd.',
  '聚會所對面巷內停車入口': 'Entrance to parking in the lane opposite the Kingdom Hall', '晶宴會館御豐館外觀': 'Exterior of Amazing Hall — Yufeng Venue',
  '晶宴會館御豐館星辰劇場入口': 'Entrance to the Star Theater at Amazing Hall — Yufeng Venue', '晶宴會館地下停車場入口': 'Entrance to the underground parking at Amazing Hall',
  '晶宴會館戶外平面停車場': 'Outdoor parking at Amazing Hall', '查看晶宴會館地下停車場位置': 'View Amazing Hall underground parking',
  '查看晶宴會館戶外平面停車場位置': 'View Amazing Hall outdoor parking', '照片上傳步驟': 'Photo upload steps',
  '婚紗相簿': 'Wedding Gallery', '婚紗相簿燈箱': 'Wedding gallery lightbox', '關閉相簿': 'Close gallery',
  '上一張照片': 'Previous photo', '下一張照片': 'Next photo', '上一張婚紗照': 'Previous wedding photo', '下一張婚紗照': 'Next wedding photo',
  '重新播放婚紗相簿': 'Play wedding gallery', '出席人數': 'Number of guests', '素食人數': 'Vegetarian meals',
  '減少出席人數': 'Decrease number of guests', '增加出席人數': 'Increase number of guests', '減少素食人數': 'Decrease vegetarian meals', '增加素食人數': 'Increase vegetarian meals'
};

const englishPlaceholders = {
  '請輸入您的姓名': 'Please enter your name', '方便聯絡的電話': 'Phone number for contact',
  '其他需要我們留意的事項': 'Anything else you would like us to know', '想對我們說的話': 'Write a message for us', '請輸入姓名': 'Enter your name'
};

translations['zh-TW'].static = {};
translations['zh-TW'].attributes = {};
translations['zh-TW'].placeholders = {};
translations.en.static = englishPhrases;
translations.en.attributes = englishAttributes;
translations.en.placeholders = englishPlaceholders;

function interpolate(template, values = {}) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function getTranslation(language, key) {
  return key.split('.').reduce((value, segment) => value?.[segment], translations[language]);
}

function currentLanguage() {
  const language = document.documentElement.dataset.language;
  return WEDDING_LANGUAGES.includes(language) ? language : 'zh-TW';
}

function translateTextNodes(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.parentElement || node.parentElement.closest('script, style')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const language = currentLanguage();
  let node;
  while ((node = walker.nextNode())) {
    if (node.__weddingOriginalText === undefined) node.__weddingOriginalText = node.nodeValue;
    const original = node.__weddingOriginalText;
    const trimmed = original.trim();
    if (!trimmed) continue;
    const translated = language === 'en' ? translations.en.static[trimmed] : trimmed;
    if (!translated) {
      node.nodeValue = original;
      continue;
    }
    const leading = original.match(/^\s*/)?.[0] ?? '';
    const trailing = original.match(/\s*$/)?.[0] ?? '';
    node.nodeValue = `${leading}${translated}${trailing}`;
  }
}

function translateAttributes(root = document) {
  const language = currentLanguage();
  root.querySelectorAll?.('[aria-label], [alt], [placeholder], [title]').forEach((element) => {
    ['aria-label', 'alt', 'placeholder', 'title'].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      if (attribute === 'aria-label' && element.dataset.i18nAriaLabel) {
        const translatedLabel = getTranslation(language, element.dataset.i18nAriaLabel);
        if (translatedLabel) element.setAttribute(attribute, translatedLabel);
        return;
      }
      const dataKey = `weddingOriginal${attribute.replace(/-(.)/g, (_, letter) => letter.toUpperCase()).replace(/^./, (letter) => letter.toUpperCase())}`;
      if (element.dataset[dataKey] === undefined) element.dataset[dataKey] = element.getAttribute(attribute);
      const original = element.dataset[dataKey];
      if (language === 'zh-TW') {
        element.setAttribute(attribute, original);
        return;
      }
      const dictionary = attribute === 'placeholder' ? translations.en.placeholders : translations.en.attributes;
      element.setAttribute(attribute, dictionary[original] ?? original);
    });
  });
}

function formatWeddingDate(language = currentLanguage()) {
  return language === 'en' ? 'Saturday, December 26, 2026' : '2026 年 12 月 26 日（六）';
}

function formatWeddingTime(datetime, language = currentLanguage()) {
  const date = new Date(datetime.includes('+') ? datetime : `${datetime}:00+08:00`);
  if (language === 'zh-TW') return new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}

function applyFormattedValues() {
  const language = currentLanguage();
  document.querySelectorAll('#ceremony-info .fact-card strong, #wedding-info .fact-card strong').forEach((element) => {
    element.textContent = formatWeddingDate(language);
  });
  document.querySelectorAll('.fact-card time[datetime]').forEach((element) => {
    element.textContent = formatWeddingTime(element.dateTime, language);
  });
  const onlineTimes = document.querySelectorAll('.online-schedule time');
  if (onlineTimes[0]) onlineTimes[0].textContent = language === 'en' ? '2:00–3:00 PM' : '14:00–15:00';
  if (onlineTimes[1]) onlineTimes[1].textContent = language === 'en' ? '3:10 PM' : '15:10';
  document.querySelectorAll('[data-rsvp-deadline]').forEach((element) => {
    element.textContent = getTranslation(language, 'seating.deadline');
  });
  document.querySelectorAll('[data-seat-lookup-open-date]').forEach((element) => {
    element.textContent = getTranslation(language, 'seating.date');
  });
}

function syncLanguageControls() {
  const language = currentLanguage();
  document.querySelectorAll('[data-language-option]').forEach((button) => {
    const active = button.dataset.languageOption === language;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', button.dataset.languageOption === 'en'
      ? getTranslation(language, 'nav.chooseEnglish')
      : getTranslation(language, 'nav.chooseChinese'));
  });
  document.querySelectorAll('.language-switch').forEach((group) => {
    group.setAttribute('aria-label', getTranslation(language, 'nav.languageGroup'));
  });
}

function applyLanguage(language, { persist = true, announce = true } = {}) {
  if (!WEDDING_LANGUAGES.includes(language)) return false;
  const savedScrollX = window.scrollX;
  const savedScrollY = window.scrollY;
  if (persist) {
    try { window.localStorage.setItem(WEDDING_LANGUAGE_STORAGE_KEY, language); } catch { /* Storage is optional. */ }
  }
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-Hant-TW';
  document.documentElement.dir = 'ltr';
  document.documentElement.dataset.language = language;
  document.title = getTranslation(language, 'meta.title');
  translateTextNodes(document);
  translateAttributes(document);
  applyFormattedValues();
  syncLanguageControls();
  if (announce) {
    window.dispatchEvent(new CustomEvent('wedding:languagechange', { detail: { language } }));
  }
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo({ left: savedScrollX, top: savedScrollY, behavior: 'auto' });
  root.style.scrollBehavior = previousScrollBehavior;
  return true;
}

document.querySelectorAll('[data-language-option]').forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.languageOption));
});

window.WeddingI18n = {
  translations,
  applyLanguage,
  getLanguage: currentLanguage,
  t(key, values = {}, language = currentLanguage()) {
    return interpolate(getTranslation(language, key) ?? getTranslation('zh-TW', key) ?? key, values);
  },
  value(key, language = currentLanguage()) {
    return getTranslation(language, key) ?? getTranslation('zh-TW', key);
  },
  translatePhrase(value, language = currentLanguage()) {
    return language === 'en' ? (translations.en.static[value] ?? value) : value;
  },
  refresh(root = document) {
    translateTextNodes(root);
    translateAttributes(root);
    applyFormattedValues();
    syncLanguageControls();
  },
  formatWeddingDate,
  formatWeddingTime
};

applyLanguage(currentLanguage(), { persist: false, announce: false });


# Kodular/Thunkable में UPI पेमेंट और सर्वर-रहित वेरिफिकेशन: एक विस्तृत गाइड

यह गाइड आपको सिखाएगी कि आप अपने Kodular या Thunkable ऐप में UPI पेमेंट सिस्टम कैसे बना सकते हैं, जिसमें पेमेंट के बाद Firebase Realtime Database का उपयोग करके एक सर्वर-रहित वेरिफिकेशन प्रक्रिया भी शामिल है।

---

### चरण 1: आवश्यक कंपोनेंट्स

सबसे पहले, अपने Kodular प्रोजेक्ट में निम्नलिखित कंपोनेंट्स को डिज़ाइनर स्क्रीन पर ड्रैग-ड्रॉप करें:

1.  **Activity Starter**: UPI Intent को भेजने के लिए।
2.  **FirebaseDB**: पेमेंट डेटा को स्टोर और वेरीफाई करने के लिए।
3.  **Notifier**: यूज़र को अलर्ट और मैसेज दिखाने के लिए।
4.  **TextBox** (जैसे `txtAmount`, `txtUpiId`, `txtNote`, `txtTransactionId`): राशि, UPI ID, नोट और ट्रांजैक्शन आईडी इनपुट करने के लिए।
5.  **Button** (जैसे `btnPayNow`, `btnSubmitTxnId`): पेमेंट शुरू करने और ट्रांजैक्शन आईडी सबमिट करने के लिए।
6.  **Label**: जानकारी प्रदर्शित करने के लिए।

**FirebaseDB प्रॉपर्टीज़ कॉन्फ़िगर करें:**
*   **Firebase Token**: अपने Firebase प्रोजेक्ट की API कुंजी डालें।
*   **Firebase URL**: अपने Firebase Realtime Database का URL डालें (जैसे `https://your-project-id-default-rtdb.firebaseio.com/`)।

---

### चरण 2: UPI पेमेंट शुरू करना (Blocks)

जब यूज़र "Pay Now" बटन पर क्लिक करता है, तो हम एक UPI Intent URL बनाएंगे और `Activity Starter` का उपयोग करके उसे भेजेंगे।

**ब्लॉक का विवरण:**

![Pay Now Blocks](https://i.postimg.cc/pX4hD7fS/kodular-upi-payment-initiate.png)

1.  **`when btnPayNow.Click`**: यह ब्लॉक तब चलता है जब पेमेंट बटन पर क्लिक किया जाता है।
2.  **URL बनाना**: हम `join` ब्लॉक का उपयोग करके UPI Intent URL बनाते हैं।
    *   `upi://pay?pa=` : यह UPI पेमेंट का स्टैंडर्ड प्रीफिक्स है।
    *   `pa`: Payee Address (आपकी UPI ID)।
    *   `pn`: Payee Name (आपका नाम)।
    *   `am`: Amount (राशि)।
    *   `cu`: Currency Code (हमेशा `INR` रहेगा)।
    *   `tn`: Transaction Note (पेमेंट का उद्देश्य, जैसे "Course Payment")।
3.  **Activity Starter को कॉन्फ़िगर करना**:
    *   `Action`: `android.intent.action.VIEW` पर सेट करें।
    *   `DataUri`: बनाए गए UPI URL पर सेट करें।
4.  **`StartActivity`**: यह UPI ऐप्स की सूची के साथ यूज़र प्रॉम्प्ट खोलेगा।

---

### चरण 3: पेमेंट के बाद ट्रांज़ैक्शन आईडी प्राप्त करना

पेमेंट के बाद, UPI ऐप से मिली जानकारी को प्रोसेस करने के लिए `Activity Starter` के `AfterActivity` इवेंट का उपयोग करें।

**ब्लॉक का विवरण:**

![After Activity Blocks](https://i.postimg.cc/KzB3sR3V/kodular-upi-after-activity.png)

1.  **`when ActivityStarter1.AfterActivity`**: यह तब चलता है जब यूज़र UPI ऐप से वापस आपके ऐप में आता है।
2.  **결과 (Result) को प्रोसेस करना**: `result` एक स्ट्रिंग होती है जिसमें `&` से अलग किए गए पैरामीटर होते हैं। हम इसे एक लिस्ट में बदलते हैं।
3.  **स्टेटस और ट्रांज़ैक्शन आईडी निकालना**: हम लिस्ट को लूप करके `Status` और `txnId` (ट्रांज़ैक्शन आईडी) निकालते हैं।
4.  **सफलता और विफलता को संभालना**:
    *   **अगर `Status` = `Success`**: यूज़र को ट्रांज़ैक्शन आईडी सबमिट करने के लिए एक प्रॉम्प्ट दिखाएं। कुछ ऐप्स `txnId` सीधे नहीं लौटाते हैं, इसलिए यूज़र से इसे मैनुअली दर्ज करवाना सबसे विश्वसनीय तरीक़ा है।
    *   **अगर `Status` = `Failure`**: यूज़र को बताएं कि पेमेंट फ़ेल हो गया।
    *   **अगर यूज़र कैंसिल करता है**: `result` आमतौर पर ख़ाली होता है। यूज़र को सूचित करें कि पेमेंट कैंसिल कर दिया गया है।

---

### चरण 4: Firebase Realtime Database में डेटा सेव करना

जब यूज़र ट्रांज़ैक्शन आईडी सबमिट करता है, तो हम इस जानकारी को Firebase में एक नई एंट्री के रूप में सेव करेंगे।

#### Firebase डेटाबेस स्ट्रक्चर (JSON)

```json
{
  "payments": {
    "USER_ID_1": {
      "COURSE_ID_1": {
        "transactionId": "USER_ENTERED_UTR_123",
        "amount": "100",
        "status": "pending",
        "courseName": "Complete Android Course",
        "timestamp": 1678886400000
      }
    },
    "USER_ID_2": {
      "COURSE_ID_2": {
        "transactionId": "USER_ENTERED_UTR_456",
        "amount": "250",
        "status": "approved",
        "courseName": "Web Development Masterclass",
        "timestamp": 1678886500000
      }
    }
  },
  "users": {
    "USER_ID_1": {
      "unlockedCourses": {
        "COURSE_ID_2": true
      }
    }
  }
}
```

**ब्लॉक का विवरण (`btnSubmitTxnId.Click`):**

![Save to Firebase Blocks](https://i.postimg.cc/t456Mhvy/kodular-upi-save-firebase.png)

1.  **प्रोजेक्ट बकेट सेट करना**: `payments/USER_ID/COURSE_ID` पर सेट करें। `USER_ID` और `COURSE_ID` को डायनामिक रूप से प्राप्त करें।
2.  **डेटा बनाना**: `make a dictionary` ब्लॉक का उपयोग करके पेमेंट की सारी जानकारी (transactionId, amount, status, timestamp) को एक साथ रखें।
3.  **`FirebaseDB.StoreValue`**: इस डिक्शनरी को निर्धारित प्रोजेक्ट बकेट में सेव करें।
4.  **यूज़र को सूचित करना**: यूज़र को बताएं कि उनका पेमेंट वेरिफिकेशन के लिए सबमिट हो गया है और इसमें 2 घंटे तक लग सकते हैं।

---

### चरण 5: सर्वर-रहित वेरिफिकेशन और कोर्स अनलॉक करना

यह प्रक्रिया एडमिन द्वारा Firebase में डेटा बदलने पर निर्भर करती है।

#### एडमिन प्रक्रिया:

1.  एडमिन Firebase कंसोल में `payments` नोड को देखता है।
2.  वह `pending` स्टेटस वाले पेमेंट की `transactionId` को अपने बैंक स्टेटमेंट से मिलाता है।
3.  वेरिफिकेशन के बाद, एडमिन Firebase कंसोल में मैन्युअल रूप से `status` को `pending` से बदलकर **`approved`** कर देता है।

#### ऐप में कोर्स कैसे अनलॉक होगा (Blocks):

![Data Changed Blocks](https://i.postimg.cc/Gpd7V9xR/kodular-upi-data-changed.png)

1.  **`when FirebaseDB.DataChanged`**: यह ब्लॉक तब चलता है जब Firebase में आपके द्वारा सुने जा रहे डेटा में कोई बदलाव होता है।
2.  **टैग और वैल्यू की जाँच करना**:
    *   अगर `tag` = `status` और `value` = `approved`, इसका मतलब है कि एडमिन ने पेमेंट को वेरीफाई कर दिया है।
3.  **कोर्स अनलॉक करना**:
    *   एक नया प्रोजेक्ट बकेट सेट करें: `users/USER_ID/unlockedCourses`।
    *   `FirebaseDB.StoreValue` का उपयोग करें और टैग के रूप में `COURSE_ID` और वैल्यू के रूप में `true` सेव करें।
4.  **यूज़र को सूचित करना**: `Notifier` का उपयोग करके यूज़र को बताएं कि उनका कोर्स अनलॉक हो गया है!

### आवश्यक अनुमतियाँ (Permissions)

Kodular में, `Activity Starter` का उपयोग करने के लिए आमतौर पर किसी विशेष अनुमति की आवश्यकता नहीं होती है क्योंकि यह एंड्रॉइड के बिल्ट-इन Intent सिस्टम का उपयोग करता है।

### संभावित समस्याएं और उनका समाधान (Edge Cases)

*   **यूज़र के पास कोई UPI ऐप नहीं है**: `Activity Starter` एक एरर देगा। इसे `Screen.ErrorOccurred` ब्लॉक से पकड़ें और यूज़र को एक UPI ऐप इंस्टॉल करने के लिए कहें।
*   **गलत ट्रांज़ैक्शन आईडी**: यूज़र ग़लत ID सबमिट कर सकता है। एडमिन वेरिफिकेशन के दौरान, आप `status` को `rejected` पर सेट कर सकते हैं और ऐप में `DataChanged` इवेंट पर यूज़र को सूचित कर सकते हैं कि उनकी ID मेल नहीं खाती।
*   **पेमेंट सफल लेकिन `AfterActivity` में डेटा नहीं मिला**: कुछ UPI ऐप्स सही से डेटा नहीं लौटाते हैं। इसीलिए, पेमेंट सफल होने का मैसेज दिखाने के बाद यूज़र से हमेशा ट्रांज़ैक्शन आईडी मैनुअली दर्ज करवाना सबसे अच्छा तरीक़ा है।

---

यह विस्तृत गाइड आपको अपने Kodular/Thunkable ऐप में एक मज़बूत और विश्वसनीय UPI पेमेंट सिस्टम बनाने में पूरी तरह से सक्षम बनाएगी।

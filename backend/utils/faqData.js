// Frequently asked questions shown on the FAQ page (/faq) and used by the AI assistant.
// Keep these in sync with how the website actually works when features change.
// Extra questions added to the FAQ collection in the database are shown after these.

const FAQ_CATEGORIES = [
  {
    id: 'about',
    title: 'About Hope for Paws',
    faqs: [
      {
        question: 'What is Hope for Paws?',
        answer:
          'Hope for Paws is a pet adoption and pet-care community for Pakistan. You can find a pet to adopt or put a pet up for adoption, share posts with other animal lovers, chat with other members, find vets, clinics and NGOs, and buy pet supplies from sellers in our Marketplace.',
      },
      {
        question: 'Is Hope for Paws free to use?',
        answer:
          'Yes. Creating an account, browsing, posting adoption ads, sharing posts and chatting are all free. You only pay for products you order from sellers in the Marketplace.',
      },
      {
        question: 'Who can I contact if I need help?',
        answer:
          'Use the Contact Us page to send a message to the Hope for Paws team, or open the assistant (the chat button on the page) for quick answers about how the website works.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & sign in',
    faqs: [
      {
        question: 'How do I create an account?',
        answer:
          'Click Sign Up, enter a username, your email address, your phone number and a password, and choose what you are registering as: User, Veterinarian, Seller or NGO. We email you a verification code; enter it on the next screen to finish. You can also sign up with your Google account.',
      },
      {
        question: 'Can I sign up with any email address?',
        answer:
          'Yes. Any valid email address works (Gmail, Outlook, Yahoo, your work email and so on).',
      },
      {
        question: 'What are the password rules?',
        answer:
          'Your password needs at least 8 characters, including an uppercase letter, a lowercase letter, a number and a special character (for example @ or #).',
      },
      {
        question: "I didn't get my verification code. What should I do?",
        answer:
          'Check your spam or promotions folder first. The code is valid for 5 minutes; if it has expired, use the resend option on the verification screen to get a new one.',
      },
      {
        question: 'Why do I need to add a phone number?',
        answer:
          'A phone number helps keep the community safe and lets adopters, sellers and buyers reach each other. If your account has no phone number yet (for example after signing up with Google), you will be taken to your Profile page to add one before using the rest of the site.',
      },
      {
        question: 'I forgot my password. How do I reset it?',
        answer:
          'On the Sign In page, enter your email address and click Forgot Password?. We email you a reset code (valid for 15 minutes); enter it and choose a new password.',
      },
      {
        question: 'Can I sign in with Google?',
        answer:
          'Yes. Use the Google button on the Sign In or Sign Up page. The first time, you choose your account type. If you already have an account with the same email, you will be asked to confirm linking your Google account to it.',
      },
      {
        question: 'How do I change my name, photo, email or phone number?',
        answer:
          'Open your Profile page. You can update your details and profile photo there. To change your email address, we send a verification code to the new address.',
      },
    ],
  },
  {
    id: 'adoption',
    title: 'Adopting a pet',
    faqs: [
      {
        question: 'How does adoption work on Hope for Paws?',
        answer:
          'Go to the Adoption page and browse the pets that are available. Open a pet and click View Details to see its age, breed, vaccination and neutering status, location and description. If it is a good match, send an adoption request. The pet owner reviews the requests and accepts the one they choose.',
      },
      {
        question: 'How much does it cost to adopt a pet?',
        answer:
          'Hope for Paws supports free adoption and discourages charging adoption fees. Please report any listing that asks for money to adopt a pet.',
      },
      {
        question: 'What do I need to send an adoption request?',
        answer:
          'You need to be signed in. The request asks for your name, email, phone number and a short message about yourself and your home. You can also attach a photo of your pet history (for example a vaccination card of a previous pet). You cannot request your own pet, and you can send only one request per pet.',
      },
      {
        question: 'How do I know if my request was accepted?',
        answer:
          'You get a notification when the owner accepts or rejects your request. You can also follow all your requests on the Adoption History page. When a request is accepted, the pet is marked as adopted and the other pending requests for that pet are closed.',
      },
      {
        question: 'Can I talk to the owner before adopting?',
        answer:
          'Yes. You can message the owner from their profile using the chat (Inbox). We strongly recommend meeting the pet, and your current pets if you have any, before finalising the adoption.',
      },
      {
        question: 'How do I know if a pet is right for me?',
        answer:
          'Think about your lifestyle, home, working hours and budget for food and vet care. Read the listing carefully, ask the owner about the pet\'s temperament and health, and spend time with the animal before you commit.',
      },
      {
        question: 'Can I adopt if I already have other pets?',
        answer:
          'Yes. Mention your current pets in your request, and arrange a meet-and-greet first to make sure the animals get along.',
      },
    ],
  },
  {
    id: 'rehome',
    title: 'Putting a pet up for adoption',
    faqs: [
      {
        question: 'How do I post a pet for adoption?',
        answer:
          'Sign in, go to the Adoption page and create a new adoption ad. Add the pet\'s name, type, breed, age, vaccination and neutering status, location, a description and up to 10 photos.',
      },
      {
        question: 'How do I review the requests for my pet?',
        answer:
          'Open My Adoptions to see your listings and the requests for each pet, including the requester\'s message, contact details and any pet history photo. Accept the person you choose; the other pending requests are rejected automatically and your pet is marked as adopted.',
      },
      {
        question: 'Can I edit or remove my adoption ad?',
        answer:
          'Yes. From My Adoptions you can edit the details and photos, change the status, or delete the listing. Only you can change or delete your own ads.',
      },
      {
        question: 'Do NGOs post adoption ads differently?',
        answer:
          'NGO accounts post and manage adoption ads the same way as other users. Once our admins verify an NGO, a verified NGO badge is shown next to its name.',
      },
    ],
  },
  {
    id: 'community',
    title: 'Community posts',
    faqs: [
      {
        question: 'What can I share in Posts?',
        answer:
          'Posts is the community feed for pet stories, rescue updates, tips and questions. Create a post with a caption and photos; other members can like and comment, and reply to comments.',
      },
      {
        question: 'Can I edit or delete my post or comment?',
        answer:
          'Yes. You can edit the caption of your own posts, and delete your own posts and comments. You can find all your posts on the My Posts page.',
      },
      {
        question: 'What does the Veterinarian badge mean?',
        answer:
          'Members who registered as veterinarians show a Veterinarian badge next to their name on posts and comments, so you can spot professional advice. For anything serious about your pet\'s health, always visit a vet in person.',
      },
    ],
  },
  {
    id: 'shopping',
    title: 'Marketplace: buying',
    faqs: [
      {
        question: 'What can I buy in the Marketplace?',
        answer:
          'Pet food, accessories, toys, grooming and health supplies and more, listed by independent sellers across Pakistan. Use search, categories and the filters (brand, seller, price and rating) to find products. More products load as you scroll.',
      },
      {
        question: 'How do I pay for my order?',
        answer:
          'Payment is Cash on Delivery: you pay when the order arrives. Online payment is not available yet.',
      },
      {
        question: 'How is shipping calculated?',
        answer:
          'Each seller sets their own shipping rates and delivery areas. The shipping fee is calculated for your city at checkout, before you place the order. Some sellers offer free shipping above a certain order amount.',
      },
      {
        question: 'How do promo codes work?',
        answer:
          'Enter the code at checkout and click apply. A promo code is created by a seller and applies only to that seller\'s products in your cart. Codes can have a minimum order amount, start and end dates and a usage limit, and each code can usually be used once per buyer.',
      },
      {
        question: 'Can I cancel my order?',
        answer:
          'Yes, while the order is still Pending. Open My Orders and cancel it. Once the seller has confirmed it, contact the seller through chat. If a promo code was used, cancelling makes it available again.',
      },
      {
        question: 'How do I track my order?',
        answer:
          'Open My Orders to see each order\'s status: Pending, Confirmed, Processing, Shipped, Delivered or Cancelled. You also get a notification when the seller updates the status.',
      },
      {
        question: 'Can I review a product?',
        answer:
          'Yes, once your order has been delivered. Open My Orders and leave a star rating and a comment for each product in the order (one review per product per order).',
      },
      {
        question: 'What does the "Unverified" seller badge mean?',
        answer:
          'Every seller can start selling right away. Sellers that the Hope for Paws team has checked show a Verified badge; the others are shown as unverified, so you can decide who to buy from.',
      },
      {
        question: 'What is the Wishlist?',
        answer:
          'Tap the heart on a product to save it to your Wishlist and find it later. You need to be signed in.',
      },
    ],
  },
  {
    id: 'selling',
    title: 'Marketplace: selling',
    faqs: [
      {
        question: 'How do I become a seller?',
        answer:
          'Sign up and choose Seller as your account type. After signing in you will set up your store: store name, location, business address and an optional logo. Your name, email and phone come from your account. You can start listing products straight away.',
      },
      {
        question: 'How does seller verification work?',
        answer:
          'New stores start as unverified. The Hope for Paws team reviews stores and marks them as verified; buyers see the badge on your store and products. Verification does not stop you from selling.',
      },
      {
        question: 'How do I add products?',
        answer:
          'Open your Seller Dashboard and add a product with a title, brand, SKU, category, description, price, optional discount, stock quantity and up to 5 photos. Set up a shipping policy first (Seller Dashboard > Policies) so buyers can see delivery fees.',
      },
      {
        question: 'How do I set shipping fees and guarantees?',
        answer:
          'In Seller Dashboard > Policies, create shipping policies (where you deliver, fees for your own city and other cities, pickup, free-shipping amount and delivery times) and guarantee policies (returns or warranty). Pick a policy for each product, or mark one as your default.',
      },
      {
        question: 'How do I create a promo code?',
        answer:
          'From your Seller Dashboard, create a promo code with a percentage or fixed discount (or free shipping), the dates it is valid, an optional minimum order amount and usage limits.',
      },
      {
        question: 'How do I manage my orders?',
        answer:
          'Seller Orders lists every order for your store. Update the status as you prepare and ship it (Confirmed, Processing, Shipped, Delivered); the buyer is notified each time.',
      },
      {
        question: 'How do I change my store name, logo or address?',
        answer:
          'Click Store settings on your Seller Dashboard. You can change the store name, logo, address and location. Your name, email and phone number come from your account and are changed on your Profile page.',
      },
      {
        question: 'Can I buy products with a seller account?',
        answer:
          'No. Seller accounts cannot use the cart or checkout. You can still use all the other parts of the website (adoption, posts, chat and so on). To buy, use a separate personal account.',
      },
      {
        question: 'Can I hide a product without deleting it?',
        answer:
          'Yes. Use the hide/show option on the product in your Seller Dashboard. Hidden products are not shown to buyers but you can still see and edit them.',
      },
    ],
  },
  {
    id: 'messages',
    title: 'Messages & notifications',
    faqs: [
      {
        question: 'How do I message someone?',
        answer:
          'Open the person\'s profile and start a chat, or open Inbox to see all your conversations. Messages arrive instantly, and you can see when the other person is online and when they have read your message.',
      },
      {
        question: 'Will I get emails about new messages?',
        answer:
          'If a message stays unread for a while, we send you an email reminder. You can turn email notifications off on your Profile page.',
      },
      {
        question: 'Can I delete a conversation?',
        answer:
          'Yes. Open the conversation and use the delete option. It is removed from your Inbox.',
      },
      {
        question: 'Where can I see my notifications?',
        answer:
          'Click the notifications icon to see likes, comments, adoption request updates, order updates and more.',
      },
    ],
  },
  {
    id: 'care',
    title: 'Vets, clinics, NGOs & pet care',
    faqs: [
      {
        question: 'How do I find a vet or clinic near me?',
        answer:
          'The Clinics & Vets page lists clinics and veterinarians with their contact details and locations. For emergencies, call the clinic directly.',
      },
      {
        question: 'Where can I find animal welfare NGOs?',
        answer:
          'The NGO\'s page lists animal welfare organisations you can contact for rescue, shelter and support.',
      },
      {
        question: 'What should I do if I find a stray or injured animal?',
        answer:
          'If it is safe, keep the animal calm and contained and check for a collar or ID. For injured animals, contact a nearby clinic from the Clinics & Vets page or an NGO from the NGO\'s page as soon as possible.',
      },
      {
        question: 'How do I care for my newly adopted pet?',
        answer:
          'Give your pet a quiet space to settle in, a proper diet, fresh water, exercise and attention. Book a vet check-up soon after adoption and keep vaccinations and deworming up to date.',
      },
      {
        question: 'Can Hope for Paws give medical advice?',
        answer:
          'No. Posts from veterinarians can be helpful, but for any health concern please consult a vet in person.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & reporting',
    faqs: [
      {
        question: 'How do I report a product or listing?',
        answer:
          'Use the Report option on the product page and choose a reason. Our team reviews reports, and listings with several reports from different members are hidden automatically until they are reviewed.',
      },
      {
        question: 'How can I stay safe when adopting or buying?',
        answer:
          'Keep conversations on Hope for Paws, meet in safe places, never pay to adopt a pet, and pay for Marketplace orders only on delivery. Report anything suspicious.',
      },
      {
        question: 'Who can see my email and phone number?',
        answer:
          'Your public profile shows your username, photo and basic details only. Your email and phone number are not shown publicly. When you send an adoption request, the details you enter are shared with that pet\'s owner.',
      },
    ],
  },
];

// Flat list: [{ question, answer, category, categoryId }]
const BUILT_IN_FAQS = FAQ_CATEGORIES.flatMap((category) =>
  category.faqs.map((faq) => ({ ...faq, category: category.title, categoryId: category.id }))
);

module.exports = { FAQ_CATEGORIES, BUILT_IN_FAQS };

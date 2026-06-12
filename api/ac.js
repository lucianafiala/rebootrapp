const AC_URL = 'https://elevatedrecovery.api-us1.com';
const AC_KEY = '0aeb817d555ec915d89f8141f068feb8e7dc15eadcbe1351991956c3a639071f78ac2daa';
const AC_LIST = 57;
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
 
  try {
    let contactId;
 
    // Step 1: Try to create contact
    const contactRes = await fetch(`${AC_URL}/api/3/contacts`, {
      method: 'POST',
      headers: { 'Api-Token': AC_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: { email } })
    });
 
    const contactData = await contactRes.json();
    contactId = contactData?.contact?.id;
 
    // Step 2: If duplicate, search for existing contact
    if (!contactId) {
      const searchRes = await fetch(`${AC_URL}/api/3/contacts?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Api-Token': AC_KEY }
      });
      const searchData = await searchRes.json();
      contactId = searchData?.contacts?.[0]?.id;
    }
 
    if (!contactId) throw new Error('Could not find or create contact');
 
    // Step 3: Add contact to list
    await fetch(`${AC_URL}/api/3/contactLists`, {
      method: 'POST',
      headers: { 'Api-Token': AC_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactList: { list: AC_LIST, contact: contactId, status: 1 }
      })
    });
 
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('AC error:', err.message);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
}

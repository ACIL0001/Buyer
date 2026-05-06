/**
 * Formats a user's name according to professional priority:
 * 1. Company Name / Entreprise
 * 2. Full Name
 * 3. First Name + Last Name
 * 4. Username
 * 5. Email
 */
export const formatUserName = (user: any): string => {
  if (!user) return 'N/A';

  const isInvalid = (val: any) => 
    !val || 
    val === 'undefined' || 
    val === 'null' || 
    (typeof val === 'string' && (val.trim() === '' || val.toLowerCase() === 'undefined' || val.toLowerCase() === 'null'));

  // 1. Professional identity
  if (!isInvalid(user.companyName)) return user.companyName;
  if (!isInvalid(user.entreprise)) return user.entreprise;

  // 2. Personal identity
  if (!isInvalid(user.fullName)) return user.fullName;
  
  const firstName = isInvalid(user.firstName) ? '' : user.firstName;
  const lastName = isInvalid(user.lastName) ? '' : user.lastName;
  const combined = `${firstName} ${lastName}`.trim();
  
  if (combined && combined.toLowerCase() !== 'undefined undefined' && combined.toLowerCase() !== 'null null') return combined;

  // 3. Account identity
  if (!isInvalid(user.username)) return user.username;
  if (!isInvalid(user.email)) return user.email;

  return 'N/A';
};

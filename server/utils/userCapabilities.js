import PartnerRequest from '../models/PartnerRequest.js';
import DriverRequest from '../models/DriverRequest.js';
import Restaurant from '../models/Restaurant.js';

export async function getUserCapabilities(user) {
  if (!user) {
    return {
      isMerchant: false,
      isShipper: false,
      showPartnerRegister: true,
      showDriverRegister: true,
      showRestaurantManage: false,
      showDriverPanel: false,
    };
  }

  const ownedRestaurant = await Restaurant.findOne({ ownerId: user._id });
  const partnerReq = await PartnerRequest.findOne({
    $or: [{ userId: user._id }, { ownerEmail: user.email?.toLowerCase() }],
  });
  const driverReq = await DriverRequest.findOne({
    email: new RegExp(`^${user.email?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });

  const isMerchant = !!(user.isMerchant || user.role === 'merchant' || ownedRestaurant);
  const isShipper = !!(user.isShipper || user.role === 'shipper');

  return {
    isMerchant,
    isShipper,
    showPartnerRegister: !isMerchant && !partnerReq,
    showDriverRegister: !isShipper && !driverReq,
    showRestaurantManage: isMerchant,
    showDriverPanel: isShipper,
  };
}

export function attachCapabilities(userDoc, capabilities) {
  const raw = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  const { password: _pw, ...user } = raw;
  return {
    ...user,
    isMerchant: capabilities.isMerchant,
    isShipper: capabilities.isShipper,
    capabilities,
  };
}

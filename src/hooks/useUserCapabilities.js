import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

const defaultCaps = {
  isMerchant: false,
  isShipper: false,
  showPartnerRegister: true,
  showDriverRegister: true,
  showRestaurantManage: false,
  showDriverPanel: false,
}

export default function useUserCapabilities() {
  const { user, isAuthenticated } = useSelector((s) => s.auth)
  const [caps, setCaps] = useState(() => {
    if (user?.capabilities) return user.capabilities
    if (user) {
      return {
        ...defaultCaps,
        isMerchant: !!user.isMerchant,
        isShipper: !!user.isShipper,
        showRestaurantManage: !!user.isMerchant,
        showDriverPanel: !!user.isShipper,
        showPartnerRegister: !user.isMerchant,
        showDriverRegister: !user.isShipper,
      }
    }
    return defaultCaps
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setCaps(defaultCaps)
      return
    }

    let cancelled = false
    const fetchCaps = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `http://localhost:5000/api/auth/capabilities?userId=${user._id}`
        )
        if (res.ok && !cancelled) {
          const data = await res.json()
          setCaps(data)
        }
      } catch {
        /* giữ state từ user local */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCaps()
    return () => { cancelled = true }
  }, [isAuthenticated, user?._id, user?.isMerchant, user?.isShipper])

  const showPartnerDropdown =
    !isAuthenticated || caps.showPartnerRegister || caps.showDriverRegister

  return { caps, loading, showPartnerDropdown }
}

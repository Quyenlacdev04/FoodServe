import HeroSection from '../components/home/HeroSection'
import RestaurantList from '../components/home/RestaurantList'
import MenuItemList from '../components/home/MenuItemList'
import AllMenuItems from '../components/home/AllMenuItems'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MenuItemList />
      <RestaurantList />
      <AllMenuItems />
    </>
  )
}

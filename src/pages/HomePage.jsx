import HeroSection from '../components/home/HeroSection'
import RestaurantList from '../components/home/RestaurantList'
import MenuItemList from '../components/home/MenuItemList'
import AllMenuItems from '../components/home/AllMenuItems'
import AIRecommendations from '../components/home/AIRecommendations'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AIRecommendations />
      <MenuItemList />
      <RestaurantList />
      <AllMenuItems />
    </>
  )
}

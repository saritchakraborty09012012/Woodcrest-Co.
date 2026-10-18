import { useSmoothScroll } from './lib/scroll'
import Nav, { EstimateWidget } from './components/Chrome'
import BuildSection from './components/BuildSection'
import PickerSection from './components/PickerSection'
import ProcessSection from './components/ProcessSection'
import StormSection from './components/StormSection'
import Calculator from './components/Calculator'
import Footer from './components/Footer'

export default function App() {
  useSmoothScroll()

  return (
    <div className="relative">
      <Nav />
      <main>
        <BuildSection />
        <PickerSection />
        <ProcessSection />
        <StormSection />
        <Calculator />
      </main>
      <Footer />
      <EstimateWidget />
    </div>
  )
}

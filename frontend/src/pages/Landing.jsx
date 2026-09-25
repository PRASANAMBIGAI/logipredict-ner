import React from 'react';
import { Link } from 'react-router-dom';
import { Box, ArrowRight, Star } from 'lucide-react';

export default function Landing() {
  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 selection:bg-blue-200">
      
      {/* 1. Hero Container Section */}
      <div className="pt-4 px-4 sm:px-6 lg:px-8">
        <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-[#0F172A]">
          {/* Background Image & Overlay */}
          <img src="/mountain_highway.png" alt="Hero Background" className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-[#0F172A]/95 z-10"></div>

          {/* Internal Navbar */}
          <nav className="flex justify-between items-center px-8 py-6 relative z-20">
            <div className="flex items-center text-white space-x-2">
              <Box className="w-6 h-6 text-blue-400" />
              <span className="font-bold text-lg tracking-wide">LogiPredict<span className="text-blue-400">AI</span></span>
            </div>
            
            <div className="hidden md:flex space-x-8 text-sm font-medium text-blue-100">
              <a href="#" className="hover:text-white transition-colors">Home</a>
              <a href="#" className="hover:text-white transition-colors">Services</a>
              <a href="#" className="hover:text-white transition-colors">Solutions</a>
              <a href="#" className="hover:text-white transition-colors">Network</a>
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/field" className="text-blue-100 hover:text-white text-sm font-medium hidden lg:block">Field App</Link>
              <Link to="/dashboard" className="bg-white text-blue-900 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors shadow-lg">
                Access Tower
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="relative z-30 pt-20 pb-48 px-4 text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-tight mb-8 drop-shadow-lg">
              Tailored intelligence for NER logistics — road, weather, and fleet routing unified on a single platform.
            </h1>
            <div className="flex justify-center space-x-4">
              <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-medium flex items-center transition-colors">
                Start Tracking <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/field" className="bg-white hover:bg-gray-100 text-blue-900 px-6 py-3 rounded-full font-medium flex items-center transition-colors">
                Field Sync <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>

          {/* Huge Background Text */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-end pointer-events-none z-20 overflow-hidden">
            <div className="text-[13vw] leading-[0.8] font-black text-white/10 text-center tracking-tighter translate-y-6 mix-blend-overlay">
              LOGIPREDICT
            </div>
          </div>

        </div>
      </div>

      {/* 2. Stats Section */}
      <section className="py-24 max-w-6xl mx-auto px-4">
        <h3 className="text-center text-sm font-bold tracking-widest text-gray-500 uppercase mb-16">
          Tailored Intelligence For Your Logistics Requirements
        </h3>
        
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-[1px] bg-gray-300 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center relative z-10">
            {[
              { stat: '30k+', label: 'Field Reports / year', sub: 'Across NER districts' },
              { stat: '2.9k', label: 'Active partners', sub: 'Carrier network' },
              { stat: '1,245', label: 'Routes / day', sub: 'Optimized dynamically' },
              { stat: '5,875', label: 'Anomalies / year', sub: 'Proactively averted' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white mb-6"></div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">{item.stat}</div>
                <div className="text-sm font-bold text-gray-700">{item.label}</div>
                <div className="text-xs text-gray-400 mt-1">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Services Section */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-none mb-6">
              ALL SET FOR SEAMLESS<br />TRANSPORTATION
            </h2>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">Dynamic Routing</span>
              <span className="px-4 py-1.5 border border-gray-200 rounded-full text-xs font-semibold text-gray-600">Offline-Sync App</span>
              <span className="px-4 py-1.5 border border-gray-200 rounded-full text-xs font-semibold text-gray-600">Weather Inference</span>
            </div>
          </div>
          <button className="mt-6 md:mt-0 px-6 py-2 border border-gray-300 rounded-full text-sm font-semibold flex items-center hover:bg-gray-50 transition-colors">
            All Features <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-80 md:h-auto rounded-3xl overflow-hidden shadow-sm relative">
            <img src="/mountain_highway.png" alt="Mountain Logistics" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="bg-gray-50 rounded-3xl p-10 flex flex-col justify-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Mountain Corridor<br/>Risk Scoring</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Complete automated visibility across every major Himalayan corridor, seamlessly adjusting for landslides and floods in real-time.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center text-sm font-bold text-gray-700">
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                </div>
                Dedicated AI Risk Inference Engine
              </li>
              <li className="flex items-center text-sm font-bold text-gray-700">
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center mr-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                </div>
                Real-time telemetry and mapping
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Sectors Section */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="relative rounded-[2.5rem] overflow-hidden min-h-[500px] flex items-center justify-end p-12 lg:p-24">
          <img src="/container_crane.png" alt="Sectors" className="absolute inset-0 w-full h-full object-cover z-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-900/90 z-10"></div>
          
          <div className="relative z-20 max-w-md text-white text-right">
            <h2 className="text-4xl font-black mb-6 leading-tight">SERVING BUSINESSES<br />ACROSS SECTORS</h2>
            <p className="text-blue-100 mb-10 text-sm leading-relaxed">
              From heavy manufacturing to high-velocity e-commerce, our AI infrastructure brings stability to the unpredictable terrain of the NER.
            </p>
            <ul className="space-y-4 text-sm font-bold">
              {['Manufacturing', 'Healthcare & Pharmaceuticals', 'Retail & E-commerce', 'Agricultural Commodities'].map(sector => (
                <li key={sector} className="flex justify-end items-center border-b border-blue-400/30 pb-3">
                  {sector} <ArrowRight className="w-4 h-4 ml-4 text-blue-400" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Testimonials */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-3xl font-black text-gray-900">TRUSTED BY THE<br />WORLD'S BEST BRANDS</h2>
          <div className="flex space-x-2">
            <div className="w-6 h-1.5 rounded-full bg-blue-600"></div>
            <div className="w-2 h-1.5 rounded-full bg-gray-300"></div>
            <div className="w-2 h-1.5 rounded-full bg-gray-300"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Anjali Desai", role: "VP Supply Chain", quote: "LogiPredict reduced our delay occurrences by 22% in the first quarter. Their risk inference acts as a radar in blind spots." },
            { name: "Rajesh Bora", role: "Director of Operations", quote: "We finally have eyes on the Shillong corridor. The offline sync means our drivers are never truly disconnected." },
            { name: "David P.", role: "CEO, E-comm Logistics", quote: "The proactive rerouting engine saved us over ₹500k in potential spoilage. The intelligence is remarkable." }
          ].map((t, i) => (
            <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-600 text-sm italic mb-8">"{t.quote}"</p>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="relative rounded-3xl overflow-hidden p-12 md:p-20 shadow-2xl">
          <img src="/truck_landscape.png" alt="Highway" className="absolute inset-0 w-full h-full object-cover z-0" />
          <div className="absolute inset-0 bg-blue-900/60 z-10 backdrop-blur-[2px]"></div>
          
          <div className="relative z-20 max-w-xl">
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              READY TO SECURE<br />YOUR LOGISTICS?
            </h2>
            <p className="text-blue-100 mb-8 text-sm leading-relaxed">
              Get a platform built specifically to handle the toughest geographical challenges in India — no hidden complexities, just sheer operational power.
            </p>
            <Link to="/dashboard" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-colors">
              Access the Tower
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-[#0A0F1C] text-white pt-20 pb-10 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between relative z-20 mb-20">
          <div className="mb-10 md:mb-0 max-w-xs">
            <div className="flex items-center space-x-2 mb-6">
              <Box className="w-6 h-6 text-blue-500" />
              <span className="font-bold text-xl tracking-wide">LogiPredict<span className="text-blue-500">AI</span></span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Global logistics intelligence built for businesses that demand reliability, predictability, and total supply chain visibility.
            </p>
            <div className="text-gray-400 text-sm space-y-2">
              <div>+91 (800) 123-4567</div>
              <div>hello@logipredict.ai</div>
              <div>Guwahati, Assam, IN</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-wider text-sm">Services</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-blue-400">Risk Inference</a></li>
                <li><a href="#" className="hover:text-blue-400">Route Optimization</a></li>
                <li><a href="#" className="hover:text-blue-400">Offline Sync</a></li>
                <li><a href="#" className="hover:text-blue-400">Fleet Telemetry</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-blue-400">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400">Careers</a></li>
                <li><a href="#" className="hover:text-blue-400">Sustainability</a></li>
                <li><a href="#" className="hover:text-blue-400">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-wider text-sm">Resources</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-blue-400">Track Shipment</a></li>
                <li><a href="#" className="hover:text-blue-400">API Docs</a></li>
                <li><a href="#" className="hover:text-blue-400">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400">Blog</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Huge Bottom Text */}
        <div className="relative z-10 border-t border-white/5 pt-10">
          <div className="text-[12vw] font-black text-white/5 text-center leading-none tracking-tighter w-full overflow-hidden whitespace-nowrap px-4">
            LOGIPREDICT
          </div>
          <div className="max-w-7xl mx-auto px-4 flex justify-between text-xs text-gray-600 mt-4">
            <div>© 2026 LogiPredict AI. All rights reserved.</div>
            <div className="space-x-4">
              <a href="#" className="hover:text-gray-300">Privacy Policy</a>
              <a href="#" className="hover:text-gray-300">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

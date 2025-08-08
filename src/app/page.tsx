import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-800 via-zinc-900 to-black -mt-14 pb-20 relative">
      {/* Subtle dot pattern overlay */}
      <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:24px_24px]"></div>
    <div className="pt-14 relative z-10">
    <MaxWidthWrapper className="mb-12 mt-28 sm:mt-40 flex flex-col items-center justify-center text-center">
      <div className="mb-8 inline-flex items-center rounded-full bg-zinc-800/50 px-4 py-2 border border-zinc-700/50 backdrop-blur-sm">
        <span className="text-sky-400 text-sm font-medium">🏆 Premium Softball Coaching</span>
      </div>
      <h1 className = 'max-w-4xl text-5xl font-bold text-zinc-100 md:text-6xl lg:text-7xl animate-fade-in tracking-tight leading-tight mb-6'>
        Take your softball pitching to the <span className="text-transparent bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 bg-clip-text font-extrabold">Next Level</span>
        </h1>
        <p className="mt-5 max-w-prose text-zinc-300 sm:text-lg font-medium leading-relaxed">
          Next Level Softball offers personalized coaching to help pitchers of all ages 
  develop power, accuracy, and confidence in the circle. With expert guidance and 
  proven training techniques, we&apos;ll help you reach your full potential and dominate 
  every game.
        </p>

        <Link
          href="/dashboard"
          target="_blank"
          className="mt-8 inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
        >
          Get Started 
          <ArrowRight className="ml-2 inline h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
    </MaxWidthWrapper>

    {/* WHY CHOOSE US SECTION */}
    <div className="mx-auto mb-20 max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4 tracking-tight">
          Why Choose Next Level Softball?
        </h2>
        <p className="text-zinc-300 text-lg font-medium">
          Trusted by athletes at every level to achieve their pitching goals
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-800/40 backdrop-blur-sm p-6 rounded-xl border border-zinc-700/50 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:bg-zinc-800/60 group hover:-translate-y-1">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🏅</div>
          <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">20+ Years Experience</h3>
          <p className="text-zinc-300 text-sm font-medium leading-relaxed">Expert coaching with proven results at every competitive level</p>
        </div>
        
        <div className="bg-zinc-800/40 backdrop-blur-sm p-6 rounded-xl border border-zinc-700/50 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:bg-zinc-800/60 group hover:-translate-y-1">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🎯</div>
          <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">Personalized Training</h3>
          <p className="text-zinc-300 text-sm font-medium leading-relaxed">Custom drills and video feedback tailored to your unique needs</p>
        </div>
        
        <div className="bg-zinc-800/40 backdrop-blur-sm p-6 rounded-xl border border-zinc-700/50 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:bg-zinc-800/60 group hover:-translate-y-1">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🧠</div>
          <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">Mental Game Training</h3>
          <p className="text-zinc-300 text-sm font-medium leading-relaxed">Build unshakeable confidence and focus under pressure</p>
        </div>
        
        <div className="bg-zinc-800/40 backdrop-blur-sm p-6 rounded-xl border border-zinc-700/50 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:bg-zinc-800/60 group hover:-translate-y-1">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📈</div>
          <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">Track Your Progress</h3>
          <p className="text-zinc-300 text-sm font-medium leading-relaxed">Detailed analytics and progress reports to monitor improvement</p>
        </div>
      </div>
    </div>

    {/*VALUE PROPOSITION SECTION*/}
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mb-20">
      <div className="rounded-xl bg-zinc-800/30 p-4 shadow-lg border border-zinc-700 flex justify-center items-center transition-all duration-300 hover:shadow-2xl hover:border-zinc-600">
        <Image
          src="/logo image.png"
          alt="logo-Dash"
          width={1536}
          height={1024}
          quality={100}
          className="rounded-md bg-zinc-700 p-2"
        />
      </div>
    </div>
        {/* Remove or comment out these two blocks */}
        
        


      {/*feature section*/}
      <div className="mx-auto mb-32 mt-32 max-w-5xl sm:mt-56">
        <div className="mb-12 px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="mt-2 font-bold text-4xl text-white sm:text-5xl tracking-tight">
              Your Path to Pitching Excellence
            </h2>
            <p className="mt-4 text-lg text-zinc-400 font-medium leading-relaxed">
              Follow our proven 3-step process to transform your pitching game
            </p>
          </div>
        </div>

        {/*ANIMATED STEP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 lg:px-8">
          <div className="bg-zinc-800/40 backdrop-blur-sm p-8 rounded-2xl border border-zinc-700/50 hover:border-sky-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-zinc-800/60 group hover:-translate-y-2">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                1
              </div>
              <span className="text-white text-xl font-semibold tracking-tight">
                Create Your Profile
              </span>
            </div>
            <p className="text-zinc-300 leading-relaxed font-medium">
              Set up your player or coach account and tell us about your pitching experience, goals, and current skill level. Choose between our premium and{' '}
              <Link href='/pricing' className="text-sky-400 underline underline-offset-2 hover:text-sky-300 transition-colors font-semibold">
                Pro
              </Link>
              {' '}pricing options.
            </p>
          </div>

          <div className="bg-zinc-800/40 backdrop-blur-sm p-8 rounded-2xl border border-zinc-700/50 hover:border-sky-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-zinc-800/60 group hover:-translate-y-2">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                2
              </div>
              <span className="text-white text-xl font-semibold tracking-tight">
                Get Personalized Training
              </span>
            </div>
            <p className="text-zinc-300 leading-relaxed font-medium">
              Receive a customized training plan based on your assessment. Access personalized drills, technique videos, and coaching tips designed specifically for your development needs.
            </p>
          </div>

          <div className="bg-zinc-800/40 backdrop-blur-sm p-8 rounded-2xl border border-zinc-700/50 hover:border-sky-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-zinc-800/60 group hover:-translate-y-2">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                3
              </div>
              <span className="text-white text-xl font-semibold tracking-tight">
                Track Your Growth
              </span>
            </div>
            <p className="text-zinc-300 leading-relaxed font-medium">
              Monitor your progress with detailed analytics and receive ongoing feedback. Get expert coaching tips, progress reports, and advanced drills to help you reach your next level.
            </p>
          </div>
        </div>
        </div>

        {/* replace image when you get there ////
         
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
         <div className="mt- flow-root sm:mt-24">
          <div className="-m- rounded-xl bg-gray-900/5 p-2 ring-l ring-inset ring-gray-900/ lg:-m-4 lg:rounded-2xl lg:p-"></div>
            <Image
              src="/.png"
              alt="product-preview"
              width={1536}
              height={1024}
              quality={100}
              className="rounded-md bg-zinc-700 p-2 sm:p-8 md:p-20 shadow-2xl ring-1 ring-gray-900/10"
            />
          </div>
         </div>
*/}
    </div>
    </div>
  );
}
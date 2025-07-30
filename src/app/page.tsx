import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <>
    <MaxWidthWrapper className="mb-12 mt-28 sm:mt-40 flex flex-col items-center justify-center text-center">
      <div className="mx-auto mb-4 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-gray-200 bg-white px-7 py-2 shadow-md backdrop-blur transition-all hover:border-gray-300 hover:bg-white/50">
        <span className="text-black text-sm font-semibold">Welcome to Next Level Softball</span>
      </div>
      <h1 className = 'max-w-4xl text-5xl font-bold text-zinc-400 md:text-6xl lg:text-7xl'>
        Take your softball pitching to the <span className="text-zinc-200">Next Level</span>
        </h1>
        <p className="mt-5 max-w-prose text-zinc-400 sm:text-lg">
          Next Level Softball offers personalized coaching to help pitchers of all ages 
  develop power, accuracy, and confidence in the circle. With expert guidance and 
  proven training techniques, we&apos;ll help you reach your full potential and dominate 
  every game.
        </p>

        <Link
          href="/dashboard"
          target="_blank"
          className={buttonVariants({ size: "lg", className: "mt-5" })}
        >
          Get Started <ArrowRight className="ml-2 inline h-5 w-5" />
        </Link>
    </MaxWidthWrapper>

    {/*VALUE PROPOSITION SECTION*/}
    

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
  <div className="rounded-xl bg-gray-900/5 p-4 shadow-lg ring-1 ring-gray-900/10 flex justify-center items-center">
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
            <h2 className="mt-2 font-bold text-4xl text-white sm:text 5xl">
              Softball placeholder text
            </h2>
            <p className="mt-4 text-lg text-white">
              softball placeholdeer text
            </p>
          </div>
        </div>

        {/*STEPS */}
        <ol className="my-8 space-y-4 pt-8 md:flex md:space-x-12 md:space-y-0">
          <li className="md-flex-1">
            <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
              <span className="text-sm font-medium text-white">
                Step 1
              </span>
              <span className="text-white text-xl font-semibold">
                Create your player/coach profile.
              </span>
              <span className="mt-2 text-zinc-400">
                Coaches can choose between our premium and{' '}
                <Link href='/pricing' className="text-orange-400 underline underline-offset-2">Pro
                </Link>
                 {' '} pricing.
              </span>
            </div>
          </li>
          <li className="md-flex-1">
            <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
              <span className="text-sm font-medium text-white">
                Step 2
              </span>
              <span className="text-white text-xl font-semibold">
                Tell us about your pitching experience, goals, and current skill level.
              </span>
              <span className="mt-2 text-zinc-400">
                We will use this information to tailor your training plan.
              </span>
            </div>
          </li>
          <li className="md-flex-1">
            <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
              <span className="text-sm font-medium text-white">
                Step 3
              </span>
              <span className="text-white text-xl font-semibold">
                Get expert feedback and track your growth.
              </span>
              <span className="mt-2 text-zinc-400">
                Receive coaching tips, progress reports, and personalized drills to help you reach your next level.
              </span>
            </div>
          </li>
        </ol>
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
    </>
  );
}
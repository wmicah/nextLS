import MaxWidthWrapper from "./MaxWidthWrapper"
import Link from 'next/link'
import { buttonVariants } from "./ui/button"
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/server"
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/server"
import { ArrowRight } from "lucide-react"


const Navbar = () => {
    return (
        <nav className="sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-zinc-700 bg-zinc-900/75 backdrop-blur-lg transition-all">
            <MaxWidthWrapper>
                <div className="flex h-14 items-center text-white justify-between">
                    <Link 
                        href='/' 
                        className="flex z-40 font-semibold text-lg tracking-tight">
                        <span>Next Level Softball</span>
                    </Link>

                    {/*TODO: add mobile navbar */}

                    <div className="text-white items-center space-x-4 sm:flex">
                        <>
                          <Link 
                            href='/pricing'
                            className={buttonVariants({
                              variant: "ghost",
                              size: 'sm',
                            })}
                            >Pricing
                            </Link>
                            <LoginLink> 
                                <span className={buttonVariants({
                                    variant: "ghost",
                                    size: 'sm',
                                })}>
                                    Sign In
                                </span>
                            </LoginLink>
                            <RegisterLink> 
                                <span className={buttonVariants({
                                    size: 'sm',
                                })}>
                                    Get Started <ArrowRight className="ml-1.5 inline h-5 w-5" />
                                </span>
                            </RegisterLink>
                
                        </>
                    </div>
                </div>
            </MaxWidthWrapper>
        </nav>
    )
}

export default Navbar
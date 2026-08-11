"use client"
import * as React from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Card } from "./ui/card"
import ChatBox from "./ChatBox"

export default function ChatBoxDrawer() {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "`") {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])
    // const isMobile = useIsMobile()

    return (

        <Drawer
            open={open}
            onOpenChange={setOpen}
            //showSwipeHandle={isMobile}
            swipeDirection="right"
        >
            <DrawerTrigger />
            <DrawerContent>
                <Card className="rounded-lg">
                    <DrawerHeader className="text-lg bold">gPBL Assistant</DrawerHeader>
                </Card>
                <ChatBox />
            </DrawerContent>
        </Drawer>
    );
}

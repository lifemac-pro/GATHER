import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Card, CardContent } from "./card"
import { Button } from "./button"

export default function Profile() {
  return (
    <Card className="w-full max-w-sm p-4">
      <CardContent className="flex flex-col items-center space-y-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src="/profile-pic.jpg" alt="User Profile" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">John Doe</h2>
        <p className="text-sm text-gray-500">johndoe@example.com</p>
        <Button>Edit Profile</Button>
      </CardContent>
    </Card>
  )
}

from rest_framework import generics, permissions
from .serializers import UserProfileSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET: Retrieve the profile of the currently authenticated user.
    PUT/PATCH: Update the profile of the currently authenticated user.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Return the User instance associated with the authenticated request
        return self.request.user
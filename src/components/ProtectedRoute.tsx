'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const userData = userDoc.data()

        if (userData && allowedRoles.includes(userData.role)) {
          setIsLoading(false)
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [router, allowedRoles])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}


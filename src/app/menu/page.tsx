'use client'
import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {  Trash2, Edit2 } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  category: string
  description: string
  price: number
  isAvailable: boolean
  preparationTime: number
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [newMenu, setNewMenu] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    preparationTime: '',
    isAvailable: true
  })
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)

  useEffect(() => {

    const unsubscribe = onSnapshot(query(collection(db, 'menu')), snapshot => {
      const menuData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem))
      setMenuItems(menuData)
    })
    return () => unsubscribe()
  }, [])

  const handleAddMenu = async () => {
    if (
      newMenu.name &&
      newMenu.category &&
      newMenu.description &&
      newMenu.price &&
      newMenu.preparationTime
    ) {
      await addDoc(collection(db, 'menu'), {
        ...newMenu,
        price: parseFloat(newMenu.price),
        preparationTime: parseInt(newMenu.preparationTime),
        isAvailable: newMenu.isAvailable
      })
      setNewMenu({
        name: '',
        category: '',
        description: '',
        price: '',
        preparationTime: '',
        isAvailable: true
      })
    }
  }

  const handleEditMenu = async () => {
    if (editingMenu) {
      const menuDoc = doc(db, 'menu', editingMenu.id)
      await updateDoc(menuDoc, {
        name: editingMenu.name,
        category: editingMenu.category,
        description: editingMenu.description,
        price: editingMenu.price,
        preparationTime: editingMenu.preparationTime,
        isAvailable: editingMenu.isAvailable
      })
      setEditingMenu(null)
    }
  }

  const handleDeleteMenu = async (id: string) => {
    const menuDoc = doc(db, 'menu', id)
    await deleteDoc(menuDoc)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
        
        {/* Add or Edit Menu */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              {editingMenu ? 'Edit Menu' : 'Add New Menu'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Name"
                value={editingMenu ? editingMenu.name : newMenu.name}
                onChange={(e) =>
                  editingMenu
                    ? setEditingMenu({ ...editingMenu, name: e.target.value })
                    : setNewMenu({ ...newMenu, name: e.target.value })
                }
              />
              <Input
                placeholder="Category"
                value={editingMenu ? editingMenu.category : newMenu.category}
                onChange={(e) =>
                  editingMenu
                    ? setEditingMenu({ ...editingMenu, category: e.target.value })
                    : setNewMenu({ ...newMenu, category: e.target.value })
                }
              />
              <Textarea
                placeholder="Description"
                value={editingMenu ? editingMenu.description : newMenu.description}
                onChange={(e) =>
                  editingMenu
                    ? setEditingMenu({ ...editingMenu, description: e.target.value })
                    : setNewMenu({ ...newMenu, description: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Price"
                value={editingMenu ? editingMenu.price.toString() : newMenu.price}
                onChange={(e) =>
                  editingMenu
                    ? setEditingMenu({
                        ...editingMenu,
                        price: parseFloat(e.target.value)
                      })
                    : setNewMenu({ ...newMenu, price: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Preparation Time (minutes)"
                value={
                  editingMenu
                    ? editingMenu.preparationTime.toString()
                    : newMenu.preparationTime
                }
                onChange={(e) =>
                  editingMenu
                    ? setEditingMenu({
                        ...editingMenu,
                        preparationTime: parseInt(e.target.value)
                      })
                    : setNewMenu({ ...newMenu, preparationTime: e.target.value })
                }
              />
              <Button
                onClick={editingMenu ? handleEditMenu : handleAddMenu}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {editingMenu ? 'Update Menu' : 'Add Menu'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu List */}
        <div className="space-y-4">
          {menuItems.map(menu => (
            <Card key={menu.id} className="flex justify-between items-center p-4">
              <div>
                <h2 className="font-bold">{menu.name}</h2>
                <p>{menu.description}</p>
                <p className="text-sm text-gray-500">
                  Category: {menu.category}, Price: ${menu.price}, Prep Time: {menu.preparationTime} mins
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingMenu(menu)}
                  className="hover:bg-yellow-100"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteMenu(menu.id)}
                  className="hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

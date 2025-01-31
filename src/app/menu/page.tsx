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
import { Trash2, Edit2, Plus, Coffee, Clock, DollarSign, Tag } from 'lucide-react'
import Swal from 'sweetalert2'

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
  const [showForm, setShowForm] = useState(false)

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
      !newMenu.name ||
      !newMenu.category ||
      !newMenu.description ||
      !newMenu.price ||
      !newMenu.preparationTime
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete Form',
        text: 'Please fill in all fields',
        confirmButtonColor: '#3B82F6'
      })
      return
    }

    try {
      await addDoc(collection(db, 'menu'), {
        ...newMenu,
        price: parseFloat(newMenu.price),
        preparationTime: parseInt(newMenu.preparationTime),
        isAvailable: newMenu.isAvailable
      })
      
      Swal.fire({
        icon: 'success',
        title: 'Menu Added',
        text: 'New menu item has been added successfully',
        confirmButtonColor: '#3B82F6'
      })
      
      setNewMenu({
        name: '',
        category: '',
        description: '',
        price: '',
        preparationTime: '',
        isAvailable: true
      })
      setShowForm(false)
    } catch  {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add menu item',
        confirmButtonColor: '#3B82F6'
      })
    }
  }

  const handleEditMenu = async () => {
    if (!editingMenu) return

    try {
      const menuDoc = doc(db, 'menu', editingMenu.id)
      await updateDoc(menuDoc, {
        name: editingMenu.name,
        category: editingMenu.category,
        description: editingMenu.description,
        price: editingMenu.price,
        preparationTime: editingMenu.preparationTime,
        isAvailable: editingMenu.isAvailable
      })
      
      Swal.fire({
        icon: 'success',
        title: 'Menu Updated',
        text: 'Menu item has been updated successfully',
        confirmButtonColor: '#3B82F6'
      })
      
      setEditingMenu(null)
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update menu item',
        confirmButtonColor: '#3B82F6'
      })
    }
  }

  const handleDeleteMenu = async (id: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Menu Item',
      text: 'Are you sure you want to delete this menu item?',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        const menuDoc = doc(db, 'menu', id)
        await deleteDoc(menuDoc)
        
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Menu item has been deleted.',
          confirmButtonColor: '#3B82F6'
        })
      } catch  {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete menu item',
          confirmButtonColor: '#3B82F6'
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Menu Management</h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Menu
          </Button>
        </div>
        
        {/* Add or Edit Menu Form */}
        {(showForm || editingMenu) && (
          <Card className="shadow-lg border-t-4 border-t-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Coffee className="w-6 h-6 mr-2 text-blue-500" />
                {editingMenu ? 'Edit Menu Item' : 'Add New Menu Item'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Description"
                    className="h-32"
                    value={editingMenu ? editingMenu.description : newMenu.description}
                    onChange={(e) =>
                      editingMenu
                        ? setEditingMenu({ ...editingMenu, description: e.target.value })
                        : setNewMenu({ ...newMenu, description: e.target.value })
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
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingMenu(null)
                    setShowForm(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingMenu ? handleEditMenu : handleAddMenu}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {editingMenu ? 'Update Menu' : 'Add Menu'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(menu => (
            <Card key={menu.id} className="hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-800">{menu.name}</h2>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMenu(menu)}
                        className="hover:bg-blue-100 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600">{menu.description}</p>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center text-gray-600">
                      <Tag className="w-4 h-4 mr-2" />
                      {menu.category}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {menu.price.toFixed(2)}
                    </div>
                    <div className="flex items-center text-gray-600 col-span-2">
                      <Clock className="w-4 h-4 mr-2" />
                      {menu.preparationTime} mins
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
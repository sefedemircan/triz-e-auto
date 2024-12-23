import { useState, useEffect } from 'react'
import {
  Paper,
  Tabs,
  Button,
  Group,
  Stack,
  Text,
  Modal,
  TextInput,
  Select,
  ActionIcon,
  Table,
  Badge,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react'
import { supabase } from '../../lib/supabase'
import { confirmModal } from '../../utils/confirmModal'

const vehicleTypes = [
  { value: 'car', label: 'Otomobil' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Kamyonet' },
]

export default function VehicleDataManager() {
  const [activeTab, setActiveTab] = useState('brands')
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [modalOpened, setModalOpened] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const brandForm = useForm({
    initialValues: {
      name: '',
      type: 'car',
    },
    validate: {
      name: (value) => !value && 'Marka adı zorunludur',
      type: (value) => !value && 'Araç tipi zorunludur',
    },
  })

  const modelForm = useForm({
    initialValues: {
      brand_id: '',
      name: '',
      series: '',
    },
    validate: {
      brand_id: (value) => !value && 'Marka seçimi zorunludur',
      name: (value) => !value && 'Model adı zorunludur',
    },
  })

  useEffect(() => {
    fetchBrands()
    fetchModels()
  }, [])

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_brands')
        .select('*')
        .order('name')

      if (error) throw error
      setBrands(data)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Markalar yüklenirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_models')
        .select(`
          *,
          vehicle_brands (
            name
          )
        `)
        .order('name')

      if (error) throw error
      setModels(data)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Modeller yüklenirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleBrandSubmit = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('vehicle_brands')
          .update(values)
          .eq('id', editingItem.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Marka güncellendi',
          color: 'green',
        })
      } else {
        const { error } = await supabase
          .from('vehicle_brands')
          .insert([values])

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Yeni marka eklendi',
          color: 'green',
        })
      }

      setModalOpened(false)
      brandForm.reset()
      setEditingItem(null)
      fetchBrands()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleModelSubmit = async (values) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('vehicle_models')
          .update(values)
          .eq('id', editingItem.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Model güncellendi',
          color: 'green',
        })
      } else {
        const { error } = await supabase
          .from('vehicle_models')
          .insert([values])

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Yeni model eklendi',
          color: 'green',
        })
      }

      setModalOpened(false)
      modelForm.reset()
      setEditingItem(null)
      fetchModels()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleDelete = async (id) => {
    try {
      await confirmModal({
        title: `${activeTab === 'brands' ? 'Marka' : 'Model'} Silme Onayı`,
        message: 'Bu kaydı silmek istediğinizden emin misiniz?',
        onConfirm: async () => {
          const { error } = await supabase
            .from(activeTab === 'brands' ? 'vehicle_brands' : 'vehicle_models')
            .delete()
            .eq('id', id)

          if (error) throw error

          notifications.show({
            title: 'Başarılı',
            message: 'Kayıt silindi',
            color: 'green',
          })

          if (activeTab === 'brands') {
            fetchBrands()
          } else {
            fetchModels()
          }
        }
      })
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  return (
    <Stack>
      <Group position="apart">
        <Text size="xl" weight={500}>Araç Veri Yönetimi</Text>
      </Group>

      <Paper p="md" radius="md" withBorder>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="brands">Markalar</Tabs.Tab>
            <Tabs.Tab value="models">Modeller</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="brands" pt="md">
            <Stack>
              <Group position="right">
                <Button
                  leftSection={<IconPlus size={14} />}
                  onClick={() => setModalOpened(true)}
                >
                  Yeni Marka
                </Button>
              </Group>

              <Table>
                <thead>
                  <tr>
                    <th>Marka</th>
                    <th>Tip</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand.id}>
                      <td>{brand.name}</td>
                      <td>
                        <Badge>
                          {vehicleTypes.find(t => t.value === brand.type)?.label}
                        </Badge>
                      </td>
                      <td>
                        <Group spacing={4}>
                          <ActionIcon onClick={() => {
                            setEditingItem(brand)
                            brandForm.setValues(brand)
                            setModalOpened(true)
                          }}>
                            <IconEdit size={18} />
                          </ActionIcon>
                          <ActionIcon color="red" onClick={() => handleDelete(brand.id)}>
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="models" pt="md">
            <Stack>
              <Group position="right">
                <Button
                  leftSection={<IconPlus size={14} />}
                  onClick={() => setModalOpened(true)}
                >
                  Yeni Model
                </Button>
              </Group>

              <Table>
                <thead>
                  <tr>
                    <th>Marka</th>
                    <th>Model</th>
                    <th>Seri</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr key={model.id}>
                      <td>{model.vehicle_brands.name}</td>
                      <td>{model.name}</td>
                      <td>{model.series || '-'}</td>
                      <td>
                        <Group spacing={4}>
                          <ActionIcon onClick={() => {
                            setEditingItem(model)
                            modelForm.setValues(model)
                            setModalOpened(true)
                          }}>
                            <IconEdit size={18} />
                          </ActionIcon>
                          <ActionIcon color="red" onClick={() => handleDelete(model.id)}>
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false)
          if (activeTab === 'brands') {
            brandForm.reset()
          } else {
            modelForm.reset()
          }
          setEditingItem(null)
        }}
        title={
          <Text size="lg">
            {editingItem ? 'Düzenle' : 'Yeni'} {activeTab === 'brands' ? 'Marka' : 'Model'}
          </Text>
        }
      >
        {activeTab === 'brands' ? (
          <form onSubmit={brandForm.onSubmit(handleBrandSubmit)}>
            <Stack>
              <TextInput
                required
                label="Marka Adı"
                {...brandForm.getInputProps('name')}
              />
              <Select
                required
                label="Araç Tipi"
                data={vehicleTypes}
                {...brandForm.getInputProps('type')}
              />
              <Button type="submit">
                {editingItem ? 'Güncelle' : 'Kaydet'}
              </Button>
            </Stack>
          </form>
        ) : (
          <form onSubmit={modelForm.onSubmit(handleModelSubmit)}>
            <Stack>
              <Select
                required
                label="Marka"
                data={brands.map(brand => ({
                  value: brand.id,
                  label: brand.name
                }))}
                {...modelForm.getInputProps('brand_id')}
              />
              <TextInput
                required
                label="Model Adı"
                {...modelForm.getInputProps('name')}
              />
              <TextInput
                label="Seriler"
                description="Virgülle ayırarak birden fazla seri girebilirsiniz"
                placeholder="Örn: AMG,Style,Progressive"
                {...modelForm.getInputProps('series')}
              />
              <Button type="submit">
                {editingItem ? 'Güncelle' : 'Kaydet'}
              </Button>
            </Stack>
          </form>
        )}
      </Modal>
    </Stack>
  )
} 
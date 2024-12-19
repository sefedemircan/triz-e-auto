import { useState, useEffect } from 'react'
import {
  TextInput,
  NumberInput,
  Select,
  Button,
  Paper,
  Stack,
  Group,
  Text,
  FileInput,
  Image,
  SimpleGrid,
  ActionIcon,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconTrash, IconUpload } from '@tabler/icons-react'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { vehicleTypes, vehicleBrands } from '../data/vehicleData'

const fuelTypes = [
  { value: 'gasoline', label: 'Benzin' },
  { value: 'diesel', label: 'Dizel' },
  { value: 'lpg', label: 'LPG' },
  { value: 'electric', label: 'Elektrik' },
  { value: 'hybrid', label: 'Hibrit' },
]

export default function VehicleForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState([])
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'car',
    fuel_type: 'gasoline',
    plate: '',
    chassis_number: '',
    purchase_price: 0,
    purchase_date: dayjs().format('YYYY-MM-DD'),
    description: '',
  })
  const [availableBrands, setAvailableBrands] = useState([])
  const [availableModels, setAvailableModels] = useState([])

  useEffect(() => {
    if (formData.type) {
      const brands = vehicleBrands[formData.type] || []
      setAvailableBrands(brands)
      setFormData(prev => ({ ...prev, brand: '', model: '' }))
      setAvailableModels([])
    }
  }, [formData.type])

  useEffect(() => {
    if (formData.type && formData.brand) {
      const brand = vehicleBrands[formData.type]?.find(b => b.value === formData.brand)
      setAvailableModels(brand?.models || [])
      setFormData(prev => ({ ...prev, model: '' }))
    }
  }, [formData.type, formData.brand])

  const handlePhotoUpload = async (files) => {
    if (!files || files.length === 0) return

    const newPhotos = [...photos]
    const newUploadedPhotos = [...uploadedPhotos]
    let hasError = false

    for (const file of files) {
      try {
        const photoId = uuidv4()
        const fileExt = file.name.split('.').pop()
        const fileName = `${photoId}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          })

        if (uploadError) throw uploadError

        const { data } = await supabase.storage
          .from('vehicle-photos')
          .getPublicUrl(filePath)

        console.log('Public URL:', data.publicUrl)

        const testImage = new Image()
        testImage.src = data.publicUrl

        newPhotos.push(URL.createObjectURL(file))
        newUploadedPhotos.push({ 
          path: filePath,
          url: data.publicUrl
        })
      } catch (error) {
        hasError = true
        console.error('Upload error:', error)
        notifications.show({
          title: 'Hata',
          message: `${file.name} yüklenirken bir hata oluştu`,
          color: 'red',
        })
      }
    }

    if (!hasError) {
      setPhotos(newPhotos)
      setUploadedPhotos(newUploadedPhotos)
      notifications.show({
        title: 'Başarılı',
        message: 'Fotoğraflar başarıyla yüklendi',
        color: 'green',
      })
    }
  }

  const handlePhotoRemove = async (index) => {
    try {
      const { error } = await supabase.storage
        .from('vehicle-photos')
        .remove([uploadedPhotos[index].path])

      if (error) throw error

      const newPhotos = photos.filter((_, i) => i !== index)
      const newUploadedPhotos = uploadedPhotos.filter((_, i) => i !== index)

      setPhotos(newPhotos)
      setUploadedPhotos(newUploadedPhotos)
    } catch (error) {
      console.error('Remove error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Fotoğraf silinirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.brand || !formData.model || !formData.year || !formData.type || 
          !formData.fuel_type || !formData.plate || !formData.chassis_number || 
          !formData.purchase_date || formData.purchase_price <= 0) {
        throw new Error('Lütfen tüm zorunlu alanları doldurun')
      }

      const { data: existingVehicles, error: plateCheckError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('plate', formData.plate)

      if (plateCheckError) throw plateCheckError

      if (existingVehicles && existingVehicles.length > 0) {
        throw new Error(`${formData.plate} plakalı araç zaten kayıtlı`)
      }

      const photoUrls = uploadedPhotos.map(photo => {
        const url = photo.url.replace('/vehicle-photos/vehicle-photos/', '/vehicle-photos/')
        return url
      })

      console.log('Kaydedilen fotoğraf URL\'leri:', photoUrls)

      const formattedData = {
        ...formData,
        purchase_date: dayjs(formData.purchase_date).format('YYYY-MM-DD'),
        photos: photoUrls,
        status: 'available'
      }

      const { error: insertError } = await supabase
        .from('vehicles')
        .insert([formattedData])

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error('Araç kaydedilirken bir hata oluştu')
      }

      notifications.show({
        title: 'Başarılı',
        message: 'Araç başarıyla kaydedildi',
        color: 'green',
      })

      navigate('/vehicles')
    } catch (error) {
      console.error('Submit error:', error)
      notifications.show({
        title: 'Hata',
        message: error.message || 'Araç kaydedilirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper p="md" radius="md" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack spacing="md">
          <Text size="xl" weight={500}>Yeni Araç Kaydı</Text>

          <SimpleGrid cols={3}>
            <Select
              required
              label="Araç Tipi"
              data={vehicleTypes}
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
            />

            <Select
              required
              label="Marka"
              data={availableBrands}
              value={formData.brand}
              onChange={(value) => setFormData({ ...formData, brand: value })}
              disabled={!formData.type}
            />

            <Select
              required
              label="Model"
              data={availableModels}
              value={formData.model}
              onChange={(value) => setFormData({ ...formData, model: value })}
              disabled={!formData.brand}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <NumberInput
              required
              label="Yıl"
              value={formData.year}
              onChange={(value) => setFormData({ ...formData, year: value })}
              min={1900}
              max={new Date().getFullYear()}
            />

            <Select
              required
              label="Yakıt Tipi"
              data={fuelTypes}
              value={formData.fuel_type}
              onChange={(value) => setFormData({ ...formData, fuel_type: value })}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput
              required
              label="Plaka"
              value={formData.plate}
              onChange={(e) => setFormData({ 
                ...formData, 
                plate: e.target.value.toUpperCase().replace(/\s+/g, '') 
              })}
              placeholder="34ABC123"
            />

            <TextInput
              required
              label="Şasi Numarası"
              value={formData.chassis_number}
              onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <NumberInput
              required
              label="Alış Fiyatı"
              value={formData.purchase_price}
              onChange={(value) => setFormData({ ...formData, purchase_price: value })}
              min={0}
              precision={2}
              thousandSeparator=","
            />

            <TextInput
              required
              type="date"
              label="Alış Tarihi"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            />
          </SimpleGrid>

          <TextInput
            label="Açıklama"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Stack spacing="xs">
            <FileInput
              label="Fotoğraflar"
              placeholder="Fotoğraf seçin"
              accept="image/*"
              multiple
              icon={<IconUpload size={14} />}
              onChange={handlePhotoUpload}
            />

            {photos.length > 0 && (
              <SimpleGrid cols={4} spacing="xs">
                {photos.map((photo, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <Image
                      src={photo}
                      radius="md"
                      alt={`Araç fotoğrafı ${index + 1}`}
                      style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                    />
                    <ActionIcon
                      color="red"
                      variant="filled"
                      size="sm"
                      style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                      }}
                      onClick={() => handlePhotoRemove(index)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </div>
                ))}
              </SimpleGrid>
            )}
          </Stack>

          <Group position="right" mt="md">
            <Button
              variant="subtle"
              onClick={() => navigate('/vehicles')}
            >
              İptal
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              Kaydet
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
} 
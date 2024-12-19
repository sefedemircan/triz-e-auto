import { useState } from 'react'
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Container,
  Button,
  Text,
  Stack,
  Group,
  Divider,
  ThemeIcon,
  Center,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconCar } from '@tabler/icons-react'

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Kayıt işlemi tamamlandı. Email adresinizi kontrol edin.',
          color: 'green',
        })
        
        setIsRegister(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/')
      }
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} my={40}>
      <Center mb={40}>
        <ThemeIcon size={48} radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
          <IconCar size={30} />
        </ThemeIcon>
      </Center>
      
      <Title
        align="center"
        sx={(theme) => ({ 
          fontFamily: theme.fontFamily,
          fontWeight: 900,
        })}
      >
        E-Auto
      </Title>
      <Text color="dimmed" size="sm" align="center" mt={5} mb={30}>
        Araç Yönetim Sistemi
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md">
        <Text size="lg" weight={500} align="center" mb="md">
          {isRegister ? 'Yeni Hesap Oluştur' : 'Giriş Yap'}
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              required
              label="Email"
              placeholder="ornek@firma.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              required
              label="Şifre"
              placeholder="Şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button 
              fullWidth 
              type="submit" 
              loading={loading}
              variant="gradient"
              gradient={{ from: 'indigo', to: 'cyan' }}
            >
              {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
            </Button>
          </Stack>
        </form>

        <Divider label="veya" labelPosition="center" my="lg" />

        <Group position="center" spacing={5}>
          <Text size="sm" color="dimmed">
            {isRegister ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}
          </Text>
          <Button 
            variant="subtle" 
            size="sm"
            compact="true"
            onClick={() => {
              setIsRegister(!isRegister)
              setEmail('')
              setPassword('')
            }}
          >
            {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
          </Button>
        </Group>
      </Paper>
    </Container>
  )
} 
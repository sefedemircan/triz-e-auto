import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Container,
  Button,
  Text,
  Anchor,
  Stack,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error
      
      notifications.show({
        title: 'Kayıt başarılı',
        message: 'Email adresinize gönderilen linki onaylayın.',
        color: 'green',
      })
      
      navigate('/login')
    } catch (error) {
      notifications.show({
        title: 'Kayıt hatası',
        message: error.message,
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} my={40}>
      <Title align="center">Yeni Hesap Oluştur</Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSignup}>
          <Stack>
            <TextInput
              required
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              required
              label="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" loading={loading}>
              Kayıt Ol
            </Button>
          </Stack>
        </form>

        <Text color="dimmed" size="sm" align="center" mt={15}>
          Zaten hesabınız var mı?{' '}
          <Anchor size="sm" component="a" href="/login">
            Giriş Yap
          </Anchor>
        </Text>
      </Paper>
    </Container>
  )
} 
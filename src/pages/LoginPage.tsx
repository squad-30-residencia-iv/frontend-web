import { useEffect, useState, type FormEvent } from 'react'
import { Brand } from '../components/login/Brand'
import { CampaignIllustration } from '../components/login/CampaignIllustration'
import { Button } from '../components/ui/Button'
import { FeedbackAlert } from '../components/ui/FeedbackAlert'
import { Input } from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'
import { replaceRoute } from '../navigation/replaceRoute'
import { ApiError, InvalidCredentialsError } from '../services/auth'
import {
  validateLoginFields,
  type LoginFieldErrors,
} from '../services/loginValidation'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      const searchParams = new URLSearchParams(window.location.search)
      const from = searchParams.get('from')
      const target = from && from.startsWith('/') && !from.startsWith('//') ? from : '/home'
      replaceRoute(target)
    }
  }, [isAuthenticated])

  function handleEmailChange(val: unknown) {
    const value = typeof val === 'string' ? val : (val as { target?: { value?: string } })?.target?.value ?? ''
    setEmail(value)
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }))
    }
    if (formError) setFormError(null)
  }

  function handlePasswordChange(val: unknown) {
    const value = typeof val === 'string' ? val : (val as { target?: { value?: string } })?.target?.value ?? ''
    setPassword(value)
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }))
    }
    if (formError) setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setFormError(null)
    const errors = validateLoginFields({ email, password })
    if (errors.email || errors.password) {
      setFieldErrors(errors)
      if (errors.email) {
        document.querySelector<HTMLInputElement>('input[type="email"], input[name="email"]')?.focus()
      } else if (errors.password) {
        document.querySelector<HTMLInputElement>('input[type="password"], input[name="password"]')?.focus()
      }
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await login({ email, password })
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        setFormError('E-mail ou senha inválidos.')
      } else if (error instanceof ApiError) {
        if (error.status === 400 || error.status === 422) {
          setFormError(error.message)
        } else {
          setFormError('Não foi possível entrar agora.')
        }
      } else {
        setFormError('Não foi possível entrar agora.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#0c1016] font-sans md:grid md:grid-cols-[49.4%_50.6%]">
      <section
        aria-label="Portal Campanhas"
        className="relative isolate overflow-hidden px-6 pt-6 pb-8 md:min-h-dvh md:px-0 md:pt-[4.5vh] md:pb-0"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_90%_60%,#1c253330,transparent_65%)]" />
        <Brand />
        <div className="relative z-10 mt-9 md:mt-[8.3vh] md:pl-[0.7vw]">
          <h1 className="text-[36px] leading-[1.01] font-bold tracking-tight text-[#f5f5f6] md:text-[clamp(34px,4.65vw,70px)]">
            Campanhas
            <br />
            que geram
            <br />
            <span className="text-[#ed202b]">resultados.</span>
          </h1>
        </div>
        <CampaignIllustration />
      </section>

      <section
        aria-labelledby="login-title"
        className="relative z-20 flex min-h-[480px] items-center justify-center rounded-t-[22px] bg-[#fff5f6] px-6 py-12 md:my-[3px] md:min-h-[calc(100dvh-6px)] md:rounded-t-[20px] md:px-[8.7vw] md:py-16"
      >
        <div className="w-full max-w-[400px] rounded-[9px] bg-[#d9d9d9] px-[clamp(14px,1.7vw,24px)] pt-[clamp(18px,2vw,28px)] pb-[clamp(40px,7.2vh,76px)]">
          <h2
            id="login-title"
            className="text-[clamp(20px,2.4vw,29px)] leading-tight font-bold tracking-tight text-black"
          >
            Bem-vindo de volta!
          </h2>
          <p className="mt-2 font-mono text-[clamp(8px,0.85vw,11px)] text-[#4d4d4d]">
            Acesse sua conta para continuar
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            validationBehavior="aria"
            className="mt-[clamp(24px,3.3vw,38px)] flex flex-col gap-4"
          >
            <Input
              label="E-mail corporativo:"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="nome@email.com"
              isRequired
              value={email}
              onChange={handleEmailChange}
              errorMessage={fieldErrors.email}
              isInvalid={Boolean(fieldErrors.email)}
              isReadOnly={isSubmitting}
            />
            <Input
              label="Senha:"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••"
              isRequired
              value={password}
              onChange={handlePasswordChange}
              errorMessage={fieldErrors.password}
              isInvalid={Boolean(fieldErrors.password)}
              isReadOnly={isSubmitting}
            />
            <Button
              type="submit"
              fullWidth
              className="mt-2"
              isPending={isSubmitting}
            >
              Entrar
            </Button>
            {formError && (
              <FeedbackAlert
                type="error"
                title={formError}
              />
            )}
          </form>
        </div>
      </section>
    </main>
  )
}

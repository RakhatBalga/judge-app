# i18n Setup Documentation

## Overview

This project now includes complete internationalization (i18n) support using `vue-i18n`, with translations for English (en), Russian (ru), and Kazakh (kk).

## Project Structure

```
src/shared/i18n/
├── index.ts                  # Main i18n configuration
├── useI18n.ts               # Composable for using i18n in components
└── locales/
    ├── en.json              # English translations
    ├── ru.json              # Russian translations
    └── kk.json              # Kazakh translations
```

## Features

- **Multiple Language Support**: English, Russian, and Kazakh
- **Persistent Language Selection**: User's language choice is saved in localStorage
- **Type-Safe Translations**: Full TypeScript support with type checking
- **Language Switcher Component**: Ready-to-use UI component for language selection
- **Reactive Updates**: All UI updates immediately when language is changed

## Usage

### In Components

Use the `useI18n()` composable to access translations:

```vue
<script setup lang="ts">
import { useI18n } from '@shared/i18n/useI18n'

const { t, locale, setLocale, availableLocales } = useI18n()
</script>

<template>
  <div>
    <h1>{{ t('teams.title') }}</h1>
    <p>{{ t('common.loading') }}</p>
  </div>
</template>
```

### Methods

- **`t(key)`** - Translate a key (e.g., `t('teams.title')`)
- **`setLocale(locale)`** - Change the current language ('en', 'ru', 'kk')
- **`locale`** - Reactive reference to current language
- **`availableLocales`** - Array of available languages

### Language Switcher Component

Use the `LanguageSwitcher` component to let users change the language:

```vue
<script setup lang="ts">
import { LanguageSwitcher } from '@shared/ui'
</script>

<template>
  <div>
    <LanguageSwitcher />
  </div>
</template>
```

## Translation Files

All translations are organized in JSON files with a nested structure:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "teams": {
    "title": "Teams",
    "filterAll": "All"
  }
}
```

### Translation Keys Organization

- **`common`** - Common UI terms
- **`navigation`** - Navigation labels
- **`app`** - Application-level strings
- **`auth`** - Authentication-related strings
- **`teams`** - Teams page strings
- **`scoring`** - Scoring page strings

## Adding New Translations

1. Identify the section where the translation belongs (or create a new one)
2. Add the key-value pair to all three language files:
   - `src/shared/i18n/locales/en.json`
   - `src/shared/i18n/locales/ru.json`
   - `src/shared/i18n/locales/kk.json`
3. Use the translation in your component with `t('section.key')`

Example:
```json
// en.json
{
  "dashboard": {
    "welcome": "Welcome"
  }
}

// ru.json
{
  "dashboard": {
    "welcome": "Добро пожаловать"
  }
}

// kk.json
{
  "dashboard": {
    "welcome": "Қош келдіңіз"
  }
}
```

Then in your component:
```vue
<h1>{{ t('dashboard.welcome') }}</h1>
```

## Default Language

The default language is **Kazakh (kk)**. When users first visit the application, they will see it in Kazakh.

The user's language preference is stored in localStorage under the key `'locale'` and will be used when they revisit the application.

## Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `ru` | Russian | Русский |
| `kk` | Kazakh | Қазақша |

## Currently Translated Sections

- **Common UI** - Basic buttons, actions, messages
- **Navigation** - Menu and navigation labels
- **Authentication** - Login page and form messages
- **Teams Management** - Team list, filtering, searching
- **Scoring System** - Scoring form, criteria, results

## Profile Menu Component

A new `ProfileMenu` component has been added to the application that provides:
- Judge profile display with avatar
- Language selector with all available languages (🇬🇧 English, 🇷🇺 Русский, 🇰🇿 Қазақша)
- Logout button

The menu appears when clicking on the judge's profile badge in the top right corner of the Teams page.

### Usage

```vue
<script setup lang="ts">
import { ProfileMenu } from '@shared/ui'
</script>

<template>
  <div>
    <ProfileMenu />
  </div>
</template>
```

The component automatically handles:
- Opening/closing the dropdown menu
- Language switching with visual indicator for current language
- User logout with router navigation
- Backdrop click to close menu

## Integration Points

i18n has been integrated into the following components:

1. **`LoginForm.vue`** - Login page messages and labels
2. **`LoginPage.vue`** - Login page title and description
3. **`FilterBar.vue`** - Team filtering and search
4. **`ScoreForm.vue`** - Scoring interface and messages
5. **`TeamsPage.vue`** - Teams list page labels

## Performance

- Translation files are bundled with the application
- No runtime file loading - translations are statically imported
- Minimal overhead for language switching

## Type Safety

The project uses TypeScript with type-safe translation keys. The `MessageSchema` type is generated from the Russian translation file and ensures all keys are valid.

## Future Enhancements

Possible improvements for the i18n setup:

- Add more languages
- Implement pluralization rules
- Add date/number formatting per language
- Create translation management UI
- Add translation validation checks

## Troubleshooting

### Translations not updating in UI
- Ensure you're using the `t()` function from `useI18n()` composable
- Check that the key exists in all three translation files

### Missing translations
- Add the missing key to all language files (en.json, ru.json, kk.json)
- Use consistent key naming across all files

### Language not persisting
- Check browser's localStorage is enabled
- Clear browser cache and localStorage if needed

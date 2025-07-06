# Form Extraction React App

A modern React application for extracting and processing form data with a beautiful UI built using Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Clean and responsive design with Tailwind CSS
- **Form Processing**: Advanced form data extraction capabilities
- **Component Library**: Reusable React components for various UI elements
- **Dashboard**: Comprehensive admin dashboard with charts and analytics
- **Authentication**: Secure user authentication system
- **Responsive Design**: Works seamlessly across all devices
- **Dark/Light Mode**: Toggle between themes
- **RTL Support**: Right-to-left language support

## 🛠️ Tech Stack

- **Frontend**: React.js
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **Icons**: Custom SVG icons
- **Build Tool**: Vite (based on package.json structure)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd fe-form-extraction
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to view the application.

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── button/         # Button components
│   ├── calendar/       # Calendar components
│   ├── card/           # Card components
│   ├── charts/         # Chart components
│   ├── fields/         # Form field components
│   ├── form/           # Form components
│   ├── icons/          # Icon components
│   ├── navbar/         # Navigation components
│   ├── sidebar/        # Sidebar components
│   └── widget/         # Widget components
├── layouts/            # Layout components
│   ├── admin/          # Admin layout
│   ├── auth/           # Authentication layout
│   └── rtl/            # RTL layout
├── views/              # Page components
│   ├── admin/          # Admin pages
│   ├── auth/           # Authentication pages
│   └── rtl/            # RTL pages
├── assets/             # Static assets
│   ├── css/            # Stylesheets
│   ├── img/            # Images
│   └── svg/            # SVG files
└── variables/          # Configuration variables
```

## 🎨 Components

### Form Components
- **InputField**: Text input with validation
- **TextField**: Multi-line text input
- **SwitchField**: Toggle switch component
- **StudentForm**: Complete student information form

### UI Components
- **Card**: Versatile card components
- **Button**: Various button styles
- **Charts**: Bar, Line, and Pie charts
- **Calendar**: Mini calendar component
- **Icons**: Custom icon library

### Layout Components
- **Navbar**: Top navigation bar
- **Sidebar**: Collapsible sidebar
- **Footer**: Page footer
- **FixedPlugin**: Theme toggle plugin

## 📱 Pages

### Admin Dashboard
- **Default Dashboard**: Main admin interface with charts and metrics
- **Tables**: Data tables with sorting and filtering
- **Profile**: User profile management
- **Marketplace**: NFT marketplace interface
- **Image Management**: Image upload and management

### Authentication
- **Sign In**: User login page
- **Sign Up**: User registration page

### RTL Support
- **RTL Dashboard**: Right-to-left layout support

## 🎯 Usage

### Basic Form Usage
```jsx
import { InputField } from './components/fields/InputField';

function MyForm() {
  return (
    <InputField
      label="Email"
      placeholder="Enter your email"
      type="email"
      required
    />
  );
}
```

### Chart Component Usage
```jsx
import { LineChart } from './components/charts/LineChart';

function Dashboard() {
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [{
      label: 'Sales',
      data: [12, 19, 3, 5]
    }]
  };

  return <LineChart data={chartData} />;
}
```

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS for styling. Configuration can be found in `tailwind.config.js`.

### PostCSS
PostCSS configuration is in `postcss.config.js` for processing CSS.

### Prettier
Code formatting is handled by Prettier with configuration in `prettier.config.js`.

## 📄 Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run linting

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- Built with React and Tailwind CSS
- Icons and components inspired by modern design systems
- Chart components powered by Chart.js

---

**Happy Coding! 🚀**

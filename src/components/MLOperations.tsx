import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Brain, Copy, Plus, Network, Target, Layers } from "lucide-react";
import { toast } from "sonner";

interface MLOperationsProps {
  onInsertCode: (code: string) => void;
}

const ML_OPERATIONS = [
  {
    category: "Data Preparation",
    icon: <Target className="w-4 h-4" />,
    operations: [
      {
        name: "Train/Test Split",
        code: `from sklearn.model_selection import train_test_split\n\n# Split data into training and testing sets\nX = df.drop('target_column', axis=1)  # Features\ny = df['target_column']  # Target variable\n\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, random_state=42\n)\n\nprint(f"Training set: {X_train.shape}")\nprint(f"Test set: {X_test.shape}")`,
        description: "Split dataset for training and testing"
      },
      {
        name: "Feature Scaling",
        code: `from sklearn.preprocessing import StandardScaler\n\n# Normalize features to have mean=0 and std=1\nscaler = StandardScaler()\nX_train_scaled = scaler.fit_transform(X_train)\nX_test_scaled = scaler.transform(X_test)\n\nprint("Features scaled successfully")`,
        description: "Standardize features for better model performance"
      },
      {
        name: "Label Encoding",
        code: `from sklearn.preprocessing import LabelEncoder\n\n# Encode categorical variables as numbers\nle = LabelEncoder()\n\n# For each categorical column\nfor col in df.select_dtypes(include=['object']).columns:\n    df[col] = le.fit_transform(df[col])\n    print(f"Encoded {col}: {df[col].unique()}")`,
        description: "Convert categorical data to numerical"
      }
    ]
  },
  {
    category: "Regression Models",
    icon: <Network className="w-4 h-4" />,
    operations: [
      {
        name: "Linear Regression",
        code: `from sklearn.linear_model import LinearRegression\nfrom sklearn.metrics import mean_squared_error, r2_score\n\n# Create and train model\nmodel = LinearRegression()\nmodel.fit(X_train, y_train)\n\n# Make predictions\ny_pred = model.predict(X_test)\n\n# Evaluate\nmse = mean_squared_error(y_test, y_pred)\nr2 = r2_score(y_test, y_pred)\n\nprint(f"MSE: {mse:.4f}")\nprint(f"R² Score: {r2:.4f}")`,
        description: "Train a linear regression model"
      },
      {
        name: "Random Forest Regression",
        code: `from sklearn.ensemble import RandomForestRegressor\nfrom sklearn.metrics import mean_squared_error, r2_score\n\n# Create and train model\nmodel = RandomForestRegressor(n_estimators=100, random_state=42)\nmodel.fit(X_train, y_train)\n\n# Predictions and evaluation\ny_pred = model.predict(X_test)\nmse = mean_squared_error(y_test, y_pred)\nr2 = r2_score(y_test, y_pred)\n\nprint(f"MSE: {mse:.4f}")\nprint(f"R² Score: {r2:.4f}")\nprint(f"Feature importance: {model.feature_importances_}")`,
        description: "Train a random forest regression model"
      }
    ]
  },
  {
    category: "Classification Models",
    icon: <Target className="w-4 h-4" />,
    operations: [
      {
        name: "Logistic Regression",
        code: `from sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import accuracy_score, classification_report, confusion_matrix\n\n# Create and train model\nmodel = LogisticRegression(random_state=42)\nmodel.fit(X_train, y_train)\n\n# Predictions\ny_pred = model.predict(X_test)\n\n# Evaluate\naccuracy = accuracy_score(y_test, y_pred)\nprint(f"Accuracy: {accuracy:.4f}")\nprint("\\nClassification Report:")\nprint(classification_report(y_test, y_pred))\nprint("\\nConfusion Matrix:")\nprint(confusion_matrix(y_test, y_pred))`,
        description: "Train a logistic regression classifier"
      },
      {
        name: "Random Forest Classifier",
        code: `from sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import accuracy_score, classification_report\n\n# Create and train model\nmodel = RandomForestClassifier(n_estimators=100, random_state=42)\nmodel.fit(X_train, y_train)\n\n# Predictions and evaluation\ny_pred = model.predict(X_test)\naccuracy = accuracy_score(y_test, y_pred)\n\nprint(f"Accuracy: {accuracy:.4f}")\nprint("\\nClassification Report:")\nprint(classification_report(y_test, y_pred))`,
        description: "Train a random forest classifier"
      },
      {
        name: "XGBoost Classifier",
        code: `import xgboost as xgb\nfrom sklearn.metrics import accuracy_score, classification_report\n\n# Create and train model\nmodel = xgb.XGBClassifier(random_state=42)\nmodel.fit(X_train, y_train)\n\n# Predictions\ny_pred = model.predict(X_test)\naccuracy = accuracy_score(y_test, y_pred)\n\nprint(f"Accuracy: {accuracy:.4f}")\nprint("\\nClassification Report:")\nprint(classification_report(y_test, y_pred))`,
        description: "Train an XGBoost classifier"
      }
    ]
  },
  {
    category: "Neural Networks (TensorFlow/Keras)",
    icon: <Layers className="w-4 h-4" />,
    operations: [
      {
        name: "Simple Neural Network",
        code: `import tensorflow as tf\nfrom tensorflow import keras\nfrom tensorflow.keras import layers\n\n# Build model\nmodel = keras.Sequential([\n    layers.Dense(64, activation='relu', input_shape=(X_train.shape[1],)),\n    layers.Dropout(0.2),\n    layers.Dense(32, activation='relu'),\n    layers.Dense(1, activation='sigmoid')  # Use 'softmax' for multi-class\n])\n\n# Compile\nmodel.compile(\n    optimizer='adam',\n    loss='binary_crossentropy',  # Use 'categorical_crossentropy' for multi-class\n    metrics=['accuracy']\n)\n\n# Train\nhistory = model.fit(\n    X_train, y_train,\n    epochs=50,\n    batch_size=32,\n    validation_split=0.2,\n    verbose=1\n)\n\n# Evaluate\nloss, accuracy = model.evaluate(X_test, y_test)\nprint(f"Test Accuracy: {accuracy:.4f}")`,
        description: "Build and train a basic neural network"
      },
      {
        name: "Convolutional Neural Network",
        code: `import tensorflow as tf\nfrom tensorflow import keras\nfrom tensorflow.keras import layers\n\n# Build CNN for image classification\nmodel = keras.Sequential([\n    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),\n    layers.MaxPooling2D((2, 2)),\n    layers.Conv2D(64, (3, 3), activation='relu'),\n    layers.MaxPooling2D((2, 2)),\n    layers.Flatten(),\n    layers.Dense(64, activation='relu'),\n    layers.Dropout(0.5),\n    layers.Dense(10, activation='softmax')  # Adjust for your classes\n])\n\n# Compile\nmodel.compile(\n    optimizer='adam',\n    loss='sparse_categorical_crossentropy',\n    metrics=['accuracy']\n)\n\nprint(model.summary())`,
        description: "Create a CNN for image classification"
      }
    ]
  },
  {
    category: "Model Evaluation & Tuning",
    icon: <Brain className="w-4 h-4" />,
    operations: [
      {
        name: "Cross-Validation",
        code: `from sklearn.model_selection import cross_val_score\nfrom sklearn.ensemble import RandomForestClassifier\n\n# Perform k-fold cross-validation\nmodel = RandomForestClassifier(n_estimators=100, random_state=42)\nscores = cross_val_score(model, X, y, cv=5, scoring='accuracy')\n\nprint(f"Cross-validation scores: {scores}")\nprint(f"Mean accuracy: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")`,
        description: "Evaluate model with cross-validation"
      },
      {
        name: "Grid Search Hyperparameters",
        code: `from sklearn.model_selection import GridSearchCV\nfrom sklearn.ensemble import RandomForestClassifier\n\n# Define parameter grid\nparam_grid = {\n    'n_estimators': [50, 100, 200],\n    'max_depth': [None, 10, 20, 30],\n    'min_samples_split': [2, 5, 10]\n}\n\n# Create model and grid search\nmodel = RandomForestClassifier(random_state=42)\ngrid_search = GridSearchCV(\n    model, param_grid, cv=5, scoring='accuracy', n_jobs=-1\n)\n\n# Fit grid search\ngrid_search.fit(X_train, y_train)\n\nprint(f"Best parameters: {grid_search.best_params_}")\nprint(f"Best score: {grid_search.best_score_:.4f}")`,
        description: "Find best hyperparameters with grid search"
      },
      {
        name: "ROC Curve & AUC",
        code: `from sklearn.metrics import roc_curve, auc, RocCurveDisplay\nimport matplotlib.pyplot as plt\n\n# Get predicted probabilities\ny_pred_proba = model.predict_proba(X_test)[:, 1]\n\n# Calculate ROC curve\nfpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)\nroc_auc = auc(fpr, tpr)\n\n# Plot\nplt.figure(figsize=(8, 6))\nplt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.2f})')\nplt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')\nplt.xlabel('False Positive Rate')\nplt.ylabel('True Positive Rate')\nplt.title('ROC Curve')\nplt.legend(loc='lower right')\nplt.show()\n\nprint(f"AUC Score: {roc_auc:.4f}")`,
        description: "Plot ROC curve and calculate AUC"
      }
    ]
  },
  {
    category: "Model Persistence",
    icon: <Network className="w-4 h-4" />,
    operations: [
      {
        name: "Save Model (Pickle)",
        code: `import pickle\n\n# Save model to file\nwith open('model.pkl', 'wb') as f:\n    pickle.dump(model, f)\n\nprint("Model saved as model.pkl")\n\n# Load model from file\nwith open('model.pkl', 'rb') as f:\n    loaded_model = pickle.load(f)\n\nprint("Model loaded successfully")`,
        description: "Save and load models with pickle"
      },
      {
        name: "Save Model (Joblib)",
        code: `import joblib\n\n# Save model (faster for large models)\njoblib.dump(model, 'model.joblib')\nprint("Model saved as model.joblib")\n\n# Load model\nloaded_model = joblib.load('model.joblib')\nprint("Model loaded successfully")`,
        description: "Save and load models with joblib"
      },
      {
        name: "Save Keras Model",
        code: `# Save entire model (architecture + weights + optimizer)\nmodel.save('my_model.h5')\nprint("Keras model saved as my_model.h5")\n\n# Load model\nfrom tensorflow import keras\nloaded_model = keras.models.load_model('my_model.h5')\nprint("Keras model loaded successfully")`,
        description: "Save and load TensorFlow/Keras models"
      }
    ]
  }
];

export const MLOperations = ({ onInsertCode }: MLOperationsProps) => {
  const handleInsert = (code: string, name: string) => {
    onInsertCode(code);
    toast.success(`Inserted: ${name}`);
  };

  const handleCopy = async (code: string, name: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied: ${name}`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Brain className="w-4 h-4" />
          ML Ops
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] bg-background">
        <SheetHeader>
          <SheetTitle>Machine Learning Operations</SheetTitle>
          <SheetDescription>
            Common ML workflows for scikit-learn, TensorFlow, and more
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          <div className="space-y-6 pr-4">
            {ML_OPERATIONS.map((category) => (
              <div key={category.category} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
                  {category.icon}
                  <span>{category.category}</span>
                </div>
                
                <div className="space-y-2">
                  {category.operations.map((op) => (
                    <div
                      key={op.name}
                      className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-foreground">{op.name}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleInsert(op.code, op.name)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Insert
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleCopy(op.code, op.name)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{op.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

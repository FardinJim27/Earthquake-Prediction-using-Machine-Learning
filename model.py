import pandas as pd
df = pd.read_csv('query2.csv')
df
df.shape
print(df.columns)
df.dtypes
df.ndim
df.size
df.isnull().sum()
df.isnull().mean()
df.drop_duplicates(inplace = True)
df.shape
df.size
df_drop = df.drop(['nst'], axis = 1)
df = df_drop
df_drop.isnull().sum()
df_drop.shape
df
df['horizontalError'] = df['horizontalError'].fillna(df['horizontalError'].median())
df.isnull().sum()
df['magError'] = df['magError'].fillna(df['magError'].median())
df['magNst'] = df['magNst'].fillna(df['magNst'].mean())
df.isnull().sum()
df = df.dropna(axis=0).reset_index(drop=True)
df.isnull().sum()
df.shape
df
df.size
df.isnull().sum()
df.shape
from matplotlib import pyplot as plt 
import seaborn as sns
plt.figure(figsize = (8,8))
plt.scatter(x = 'depth', y = 'mag', data = df)
# scatter plot with pyplot
plt.xlabel('Depth')
plt.ylabel('Magnitude')
plt.title('Scatterplot of Depth against Magnitude');
sns.scatterplot(x = 'depth', y = 'mag', data = df);
# scatter plot with Seaborn
sns.scatterplot(x = 'depth', y = 'mag', hue = 'magType', data = df);
#plt.axhline(y=222, color='r', linestyle='-');
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt 
%matplotlib inline
df.head()
df.shape
sns.kdeplot(x = "mag", data = df, shade = True)
sns.kdeplot(x = "mag", data = df, shade = True, hue = "magType")
sns.kdeplot(data = df["depth"], shade = True)
sns.kdeplot(x = "depth", data = df, shade = True, hue = "magType")
sns.kdeplot(data = df["rms"], shade = True)
sns.kdeplot(x = "rms", data = df, shade = True, hue = "magType")
import seaborn as sns
sns.histplot(x = "mag", data = df);
sns.histplot(x = "mag", data = df, hue = "magType");
sns.histplot(x = "depth", data = df);
sns.histplot(x = "depth", data = df, hue = "magType");
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(x = 'latitude', data = df, color = random.choice(colorlist)); # horizontal box plot
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(x = 'longitude', data = df, color = random.choice(colorlist)); # horizontal box plot
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(x = 'depth', data = df, color = random.choice(colorlist)); # horizontal box plot
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(x = 'mag', data = df, color = random.choice(colorlist)); # horizontal box plot
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(x = 'gap', data = df, color = random.choice(colorlist)); # horizontal box plot
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(x = 'dmin', data = df, color = random.choice(colorlist)); # horizontal box plot
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(x = 'rms', data = df, color = random.choice(colorlist)); # horizontal box plot
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(x = 'horizontalError', data = df, color = random.choice(colorlist)); # horizontal box plot
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(y = 'depthError', data = df, color = random.choice(colorlist)); # vertical box plot
import random
colorlist = ['red', 'yellow', 'orange', 'purple', 'blue']
sns.boxplot(x = 'magError', data = df, color = random.choice(colorlist)); # horizontal box plot
#outlier detection & IQR
def findOutliers(df):
    outliers = []
    Q2 = df.median()
    Q1 = df.describe()[4]
    Q3 = df.describe()[6]
    
    # Q1 = dataset.quantile(0.25)
    # Q3 = dataset.quantile(0.75)
    
    IQR = Q3 - Q1
    lf = Q1 - 1.5*IQR # lf = lower fence
    uf = Q3 + 1.5*IQR # Uf = Upper fence
    for x in df:
        if x < lf or x > uf:
            outliers.append(x)
    return outliers
df.describe()
df['latitude'].quantile(0.25)
df['latitude'].quantile(0.75)
df['longitude'].quantile(0.25)
df['longitude'].quantile(0.75)
df['depth'].quantile(0.25)
df['depth'].quantile(0.75)
df['mag'].quantile(0.25)
df['mag'].quantile(0.75)
df['gap'].quantile(0.25)
df['gap'].quantile(0.75)
df['dmin'].quantile(0.25)
df['dmin'].quantile(0.75)
df['rms'].quantile(0.25)
df['rms'].quantile(0.75)
df['horizontalError'].quantile(0.25)
df['horizontalError'].quantile(0.75)
df['depthError'].quantile(0.25)
df['depthError'].quantile(0.75)
df['magError'].quantile(0.25)
df['magError'].quantile(0.75)
sns.swarmplot(x = 'mag', data = df)
sns.swarmplot(x = 'magType', y = 'mag', data = df)
sns.stripplot(x = 'magType', y = 'mag', data = df)
df.head()
df['mag'].value_counts(normalize = True)*100
# Separate Independent (X) and Dependent(y) 

y = df['mag']
X = df.drop(columns = ['time', 'mag', 'magType', 'updated', 'id', 'place', 'net', 'type', 'status', 'locationSource', 'magSource'], axis=1)
X.head()
# Return an one-dimensional array containing counts of unique values
df['mag'].value_counts()
# For imbalanced dataset
from sklearn.model_selection import StratifiedKFold

skfold = StratifiedKFold(n_splits=5)

# Imbalanced balance
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.25, random_state = 20)

print(X_train.shape,X_test.shape,y_train.shape,y_test.shape)
y_test.value_counts() #without stratify
#Packages / libraries
#import os #provides functions for interacting with the operating system
import numpy as np 
import pandas as pd
from matplotlib import pyplot as plt
import seaborn as sns

%matplotlib inline 
#make the plot outputs appear and be stored within the notebook

# To change scientific numbers to float
np.set_printoptions(formatter={'float_kind':'{:f}'.format})

# Increases the size of sns plots
sns.set(rc={'figure.figsize':(8,6)})

# Datetime lib
from pandas import to_datetime
import itertools
import warnings
import datetime
warnings.filterwarnings('ignore')

from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn import tree # used to visualize the decision tree model
from sklearn.metrics import accuracy_score, confusion_matrix, r2_score
raw_data = pd.read_csv('query2.csv') # raw_data is the panda's dataframe

# print the shape
print(raw_data.shape)

#runs the first 5 rows
raw_data.head()
df.describe()
df.columns
df['mag'].value_counts() 
df['depth'].unique()
df['place'].unique() # prints unique value of the "NumOfProducts" column
duplicate = df[df.duplicated()] #identify duplicate rows
duplicate #view duplicate rows
# Checking for null values per features
df.isnull().sum()
df.columns
#list the important columns
myList = ['time', 'latitude','longitude', 'depth', 'mag', 'magType',
          'gap', 'dmin', 'rms', 'net', 'id', 'updated', 'place', 'type', 'magError',
         'magNst', 'status', 'locationSource', 'magSource']
#create a new dataframe with this list of important columns
df2 = df[myList]
print(df2.shape)
df2.head()
# Show the counts of observations in each categorical bin using bars
sns.countplot(x = 'mag', data = df2, hue = 'magType'); 
sns.countplot(x = 'gap', data = df2, hue = 'magType');
df['magType'].unique()
from sklearn.preprocessing import OneHotEncoder
ohe= OneHotEncoder()

feature_array=ohe.fit_transform(df[['magType']]).toarray()
feature_labels = np.array(ohe.categories_).ravel()
features=pd.DataFrame(feature_array, columns=feature_labels)
features
df_ohe=pd.concat([df,features],axis=1)
df_ohe
#Creating Decision Tree
from sklearn.tree import DecisionTreeRegressor
import numpy as np
from sklearn.metrics import mean_squared_error

# Create and train the Decision Tree regression model
dt = DecisionTreeRegressor()
dt.fit(X_train, y_train) # train with training set; fit function is used to train the model

# Predict the values of the target variable for the training set
y_pred_train = dt.predict(X_train)
# Predict the values of the target variable for the test set
y_pred_test = dt.predict(X_test)

# Calculate the MSE for the training and test sets
train_mse = mean_squared_error(y_train, y_pred_train)
test_mse = mean_squared_error(y_test, y_pred_test)

# Print the MSE for the training and test sets
print('Train MSE:', train_mse)
print('Test MSE:', test_mse)

from sklearn.metrics import mean_squared_error

# Create and train the Decision Tree regression model
dt = DecisionTreeRegressor()
dt.fit(X_train, y_train)

# Predict the values of the target variable for the training set
y_pred_train = dt.predict(X_train)
# Predict the values of the target variable for the test set
y_pred_test = dt.predict(X_test)

# Calculate the MSE for the training and test sets
train_mse = mean_squared_error(y_train, y_pred_train)
test_mse = mean_squared_error(y_test, y_pred_test)

# Calculate the root mean absolute error for the train and test sets
train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))

# Print the MSE for the training and test sets
print('Train RMSE:', train_rmse)
print('Test RMSE:', test_rmse)

from sklearn.metrics import mean_absolute_error

# Create and train the Decision Tree regression model
dt = DecisionTreeRegressor()
dt.fit(X_train, y_train)

# Predict the values of the target variable for the training set
y_pred_train = dt.predict(X_train)
# Predict the values of the target variable for the test set
y_pred_test = dt.predict(X_test)

# Calculate the MSE for the training and test sets
train_mae = mean_absolute_error(y_train, y_pred_train)
test_mae = mean_absolute_error(y_test, y_pred_test)

# Print the MSE for the training and test sets
print('Train MAE:', train_mae)
print('Test MAE:', test_mae)
from sklearn.metrics import r2_score

# Create and train the Decision Tree regression model
dt = DecisionTreeRegressor()
dt.fit(X_train, y_train)

# Predict the values of the target variable for the training set
y_pred_train = dt.predict(X_train)
# Predict the values of the target variable for the test set
y_pred_test = dt.predict(X_test)

# Calculate the MSE for the training and test sets
train_mse = r2_score(y_train, y_pred_train)
test_mse = r2_score(y_test, y_pred_test)

# Print the MSE for the training and test sets
print('Train R2_score:', train_mse)
print('Test R2_score:', test_mse)
#plotting tree

fig = plt.figure(figsize=(35,30))
fig = tree.plot_tree(dt, 
                   feature_names=df.drop('mag', axis=1).columns,    
    class_names=df['mag'].unique().astype(str),
                   filled=True)
#Randomize CV
import numpy as np
from sklearn.tree import DecisionTreeRegressor
from sklearn.model_selection import RandomizedSearchCV

splitter = ['best', 'random']
max_depth = [int(x) for x in np.linspace(10,50,10)]
min_samples_split = [2, 5, 8, 10]
min_samples_leaf = [1, 2, 4,6]

random_grid = {'splitter': splitter,
               'max_depth': max_depth,
               'min_samples_split': min_samples_split,
               'min_samples_leaf': min_samples_leaf,               
              }
print(random_grid)
dt_randomcv=RandomizedSearchCV(estimator=dt, param_distributions=random_grid, n_iter=20,cv=5, verbose=2, random_state=100,n_jobs=-1)
dt_randomcv.fit(X_train,y_train)
dt_randomcv.best_params_
dt_randomcv.best_estimator_
#Randomize CV R2,MAE,MSE,RMSE
best_random_grid=dt_randomcv.best_estimator_
ytrain_rcvpredict=best_random_grid.predict(X_train)
ytest_rcvpredict=best_random_grid.predict(X_test)

print('Randomized CV hyperparameter:-\n')
print('Decision Tree training data randomizedCV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_rcvpredict))
print('Decision Tree test data randomizedCV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_rcvpredict))
print('Decision Tree training data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_rcvpredict)))
print('Decision Tree test data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f \n'% np.sqrt(mean_squared_error(y_test,ytest_rcvpredict)))
print('Decision Tree training data randomizedCV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_rcvpredict))
print('Decision Tree test data randomizedCV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_rcvpredict))
print('Decision Tree training data randomizedCV R-squared, R2=%.2f'% best_random_grid.score(X_train,y_train))
print('Decision Tree test data randomizedCV R-squared, R2=%.2f \n'% best_random_grid.score(X_test,y_test))

from sklearn.model_selection import GridSearchCV
param_grid = {
    'max_depth': [dt_randomcv.best_params_['max_depth']],
    'splitter': [dt_randomcv.best_params_['splitter']],
    'min_samples_leaf': [dt_randomcv.best_params_['min_samples_leaf'], 
                         dt_randomcv.best_params_['min_samples_leaf']+2, 
                         dt_randomcv.best_params_['min_samples_leaf'] + 4],
    'min_samples_split': [dt_randomcv.best_params_['min_samples_split'] - 2,
                          dt_randomcv.best_params_['min_samples_split'] - 1,
                          dt_randomcv.best_params_['min_samples_split'], 
                          dt_randomcv.best_params_['min_samples_split'] +1,
                          dt_randomcv.best_params_['min_samples_split'] + 2],
}
print(param_grid)
grid_search=GridSearchCV(estimator=dt,param_grid=param_grid,cv=2,n_jobs=-1,verbose=2)
grid_search.fit(X_train,y_train)
grid_search.best_estimator_
#Grid CV R2,MAE,MSE,RMSE
best_grid=grid_search.best_estimator_
ytrain_gcvpredict=best_grid.predict(X_train)
ytest_gcvpredict=best_grid.predict(X_test)

print('GridSearch CV hyperparameter:-\n')

print('Decision Tree training data Grid CV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_gcvpredict))
print('Decision Tree test data Grid CV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_gcvpredict))
print('Decision Tree training data Grid CV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_gcvpredict)))
print('Decision Tree test data Grid CV Root-Mean-Squared-Error, RMSE= %.2f\n'% np.sqrt(mean_squared_error(y_test,ytest_gcvpredict)))
print('Decision Tree training data Grid CV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_gcvpredict))
print('Decision Tree test data Grid CV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_gcvpredict))
print('Decision Tree training data Grid CV R-squared, R2=%.2f'% best_grid.score(X_train,y_train))
print('Decision Tree test data Grid CV R-squared, R2=%.2f \n'% best_grid.score(X_test,y_test))

from sklearn.neighbors import KNeighborsRegressor
from sklearn.linear_model import LinearRegression
lin_reg=LinearRegression()
knn_reg = KNeighborsRegressor(n_neighbors=5, metric='minkowski', p=2)  # Euclidean Distance Metric for Regression
lin_reg.fit(X_train, y_train)
from sklearn.metrics import mean_squared_error

lin_reg.fit(X_train, y_train)
y_pred = lin_reg.predict(X_test)
y_pred_train = lin_reg.predict(X_train)
y_pred_test = lin_reg.predict(X_test)

train_mse = mean_squared_error(y_train, y_pred_train)
test_mse = mean_squared_error(y_test, y_pred_test)

print("Train MSE:", train_mse)
print("Test MSE:", test_mse)

# Calculate the root mean absolute error for the train and test sets
train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))

print("Train RMSE:", train_rmse)
print("Test RMSE:", test_rmse)
from sklearn.metrics import r2_score

lin_reg.fit(X_train, y_train)
y_pred_train = lin_reg.predict(X_train)
y_pred_test = lin_reg.predict(X_test)

r2_train = r2_score(y_train, y_pred_train)
r2_test = r2_score(y_test, y_pred_test)

print("Train R2 Score:", r2_train)
print("Test R2 Score:", r2_test)
from sklearn.metrics import mean_absolute_error

lin_reg.fit(X_train, y_train)
y_pred = lin_reg.predict(X_test)

train_mae = mean_absolute_error(y_train, y_pred_train)
test_mae = mean_absolute_error(y_test, y_pred_test)

print("Train MAE:", train_mae)
print("Test MAE:", test_mae)
#Randomize CV
import numpy as np
from sklearn.model_selection import RandomizedSearchCV

n_neighbors = [int(x) for x in np.linspace(start = 200, stop = 1000, num = 20)]
weights = ['uniform', 'distance']
leaf_size = [2, 5, 8, 10]
metric = ['euclidean', 'manhattan', 'chebyshev']

random_grid = {'n_neighbors': n_neighbors,
               'weights': weights,
               'leaf_size': leaf_size,
               'metric':metric,              
              }
print(random_grid)
knn=KNeighborsRegressor()
knn_randomcv=RandomizedSearchCV(estimator=knn, param_distributions=random_grid, n_iter=20,cv=5, verbose=2, random_state=100,n_jobs=-1)
knn_randomcv.fit(X_train,y_train)
knn_randomcv.best_params_
knn_randomcv.best_estimator_
#Randomize CV R2,MAE,MSE,RMSE
best_random_grid=knn_randomcv.best_estimator_
ytrain_rcvpredict=best_random_grid.predict(X_train)
ytest_rcvpredict=best_random_grid.predict(X_test)

print('Randomized CV hyperparameter:-\n')
print('KNN training data randomizedCV R-squared, R2=%.2f'% best_random_grid.score(X_train,y_train))
print('KNN test data randomizedCV R-squared, R2=%.2f \n'% best_random_grid.score(X_test,y_test))
print('KNN training data randomizedCV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_rcvpredict))
print('KNN test data randomizedCV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_rcvpredict))
print('KNN training data randomizedCV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_rcvpredict))
print('KNN test data randomizedCV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_rcvpredict))
print('KNN training data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_rcvpredict)))
print('KNN test data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_rcvpredict)))
#Grid CV

from sklearn.model_selection import GridSearchCV
param_grid = {
    'n_neighbors': [knn_randomcv.best_params_['n_neighbors']],
    'weights': [knn_randomcv.best_params_['weights']],
    'metric': [knn_randomcv.best_params_['metric']],
    'leaf_size': [knn_randomcv.best_params_['leaf_size'],
                         knn_randomcv.best_params_['leaf_size']+2,
                         knn_randomcv.best_params_['leaf_size'] + 4],
   
}
print(param_grid)
grid_search=GridSearchCV(estimator=knn,param_grid=param_grid,cv=2,n_jobs=-1,verbose=2)
grid_search.fit(X_train,y_train)
grid_search.best_estimator_
#Grid CV R2,MAE,MSE,RMSE
best_grid=grid_search.best_estimator_
ytrain_gcvpredict=best_grid.predict(X_train)
ytest_gcvpredict=best_grid.predict(X_test)

print('Grid CV hyperparameter:-\n')
print('KNN training data Grid CV R-squared, R2=%.2f'% best_grid.score(X_train,y_train))
print('KNNtest data Grid CV R-squared, R2=%.2f \n'% best_grid.score(X_test,y_test))
print('KNN training data Grid CV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_gcvpredict))
print('KNN test data Grid CV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_gcvpredict))
print('KNN training data Grid CV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_gcvpredict))
print('KNN test data Grid CV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_gcvpredict))
print('KNN training data Grid CV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_gcvpredict)))
print('KNN test data Grid CV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_gcvpredict)))
#dataset split to X and Y
x=df_ohe.drop(['magType','id','place','type','status','locationSource','magSource','mag','time','updated','net'],axis=1)
y=df_ohe['mag']
from sklearn.model_selection import train_test_split

x_train,x_test,y_train,y_test= train_test_split(x, y, test_size=0.25)  #VAR
print(x_train.shape,x_test.shape,y_train.shape,y_test.shape)
x
#RF implement
from sklearn.ensemble import RandomForestRegressor 
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

rf=RandomForestRegressor()
value_rf=rf.fit(x_train,y_train)
ytrain_predict=value_rf.predict(x_train)
ytest_predict=value_rf.predict(x_test)
#Default hyperparameter R2,MAE,MSE,RMSE
print('Default Hyper parameter:-\n')
print('Random Forest training data default hyperparameter R-squared, R2=%.2f'% value_rf.score(x_train,y_train))
print('Random Forest test data default hyperparameter R-squared, R2=%.2f \n'% value_rf.score(x_test,y_test))
print('Random Forest training data default hyperparameter Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_predict))
print('Random Forest test data default hyperparameter Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_predict))
print('Random Forest training data default hyperparameter Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_predict))
print('Random Forest test data default hyperparameter Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_predict))
print('Random Forest training data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_predict)))
print('Random Forest test data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_predict)))
#Randomize CV
import numpy as np
from sklearn.model_selection import RandomizedSearchCV

n_estimators = [int(x) for x in np.linspace(start = 100, stop = 800, num = 20)]
max_features = ['auto', 'sqrt','log2']
max_depth = [int(x) for x in np.linspace(10,100,10)]
min_samples_split = [2, 5, 8, 10]
min_samples_leaf = [1, 2, 4,6]

random_grid = {'n_estimators': n_estimators,
               'max_features': max_features,
               'max_depth': max_depth,
               'min_samples_split': min_samples_split,
               'min_samples_leaf': min_samples_leaf,               
              }
print(random_grid)
rf_randomcv=RandomizedSearchCV(estimator=rf, param_distributions=random_grid, n_iter=25,cv=5, verbose=2, random_state=100,n_jobs=-1)
rf_randomcv.fit(x_train,y_train)
rf_randomcv.best_params_
rf_randomcv.best_estimator_
#Randomize CV R2,MAE,MSE,RMSE
best_random_grid=rf_randomcv.best_estimator_
ytrain_rcvpredict=best_random_grid.predict(x_train)
ytest_rcvpredict=best_random_grid.predict(x_test)

print('Randomized CV hyperparameter:-\n')
print('Random Forest training data randomizedCV R-squared, R2=%.2f'% best_random_grid.score(x_train,y_train))
print('Random Forest test data randomizedCV R-squared, R2=%.2f \n'% best_random_grid.score(x_test,y_test))
print('Random Forest training data randomizedCV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_rcvpredict))
print('Random Forest test data randomizedCV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_rcvpredict))
print('Random Forest training data randomizedCV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_rcvpredict))
print('Random Forest test data randomizedCV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_rcvpredict))
print('Random Forest training data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_rcvpredict)))
print('Random Forest test data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_rcvpredict)))
#Grid CV

from sklearn.model_selection import GridSearchCV
param_grid = {
    'max_depth': [rf_randomcv.best_params_['max_depth']],
    'max_features': [rf_randomcv.best_params_['max_features']],
    'min_samples_leaf': [rf_randomcv.best_params_['min_samples_leaf'], 
                         rf_randomcv.best_params_['min_samples_leaf']+2, 
                         rf_randomcv.best_params_['min_samples_leaf'] + 4],
    'min_samples_split': [rf_randomcv.best_params_['min_samples_split'] - 2,
                          rf_randomcv.best_params_['min_samples_split'] - 1,
                          rf_randomcv.best_params_['min_samples_split'], 
                          rf_randomcv.best_params_['min_samples_split'] +1,
                          rf_randomcv.best_params_['min_samples_split'] + 2],
    'n_estimators': [rf_randomcv.best_params_['n_estimators'] - 50, rf_randomcv.best_params_['n_estimators'] - 100, 
                     rf_randomcv.best_params_['n_estimators'], 
                     rf_randomcv.best_params_['n_estimators'] + 100, rf_randomcv.best_params_['n_estimators'] + 200]
}
print(param_grid)
grid_search=GridSearchCV(estimator=rf,param_grid=param_grid,cv=2,n_jobs=-1,verbose=2)
grid_search.fit(x_train,y_train)
grid_search.best_estimator_
#Grid CV R2,MAE,MSE,RMSE
best_grid=grid_search.best_estimator_
ytrain_gcvpredict=best_grid.predict(x_train)
ytest_gcvpredict=best_grid.predict(x_test)

print('Grid CV hyperparameter:-\n')
print('Random Forest training data Grid CV R-squared, R2=%.2f'% best_grid.score(x_train,y_train))
print('Random Forest test data Grid CV R-squared, R2=%.2f \n'% best_grid.score(x_test,y_test))
print('Random Forest training data Grid CV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_gcvpredict))
print('Random Forest test data Grid CV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_gcvpredict))
print('Random Forest training data Grid CV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_gcvpredict))
print('Random Forest test data Grid CV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_gcvpredict))
print('Random Forest training data Grid CV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_gcvpredict)))
print('Random Forest test data Grid CV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_gcvpredict)))
#Gradient boost data split

x_train,x_test,y_train,y_test= train_test_split(x, y, test_size=0.25, random_state=100) #VAR
print(x_train.shape,x_test.shape,y_train.shape,y_test.shape)
#implement gbr
from sklearn.ensemble import GradientBoostingRegressor
gbr_model=GradientBoostingRegressor() #VAR 
value_gbr=gbr_model.fit(x_train,y_train)
ytrain_predict=value_gbr.predict(x_train)
ytest_predict=value_gbr.predict(x_test)
#Default hyperparameter R2,MAE,MSE,RMSE
print('Default Hyper parameter:-\n')
print('Gradient Boosting train data default hyperparameter R-squared, R2=%.2f'%value_gbr.score(x_train,y_train))
print('Gradient Boosting test data default hyperparameter R-squared, R2=%.2f\n'% value_gbr.score(x_test,y_test))
print('Gradient Boosting train data default hyperparameter Mean-Absolute-Error, MAE= %.2f'%mean_absolute_error(y_train,ytrain_predict))
print('Gradient Boosting test data default hyperparameter Mean-Absolute-Error, MAE= %.2f\n'% mean_absolute_error(y_test,ytest_predict))
print('Gradient Boosting train data default hyperparameter Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_predict))
print('Gradient Boosting test data default hyperparameter Mean-Squared-Error, MSE= %.2f\n'% mean_squared_error(y_test,ytest_predict))
print('Gradient Boosting train data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_predict)))
print('Gradient Boosting test data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f\n'% np.sqrt(mean_squared_error(y_test,ytest_predict)))
#Randomize CV
import numpy as np
from sklearn.model_selection import RandomizedSearchCV

n_estimators = [int(x) for x in np.linspace(start = 200, stop = 1000, num = 10)]
max_features = ['auto', 'sqrt','log2']
max_depth = [int(x) for x in np.linspace(10, 100,10)]
learning_rate=[0.001, 0.1, 0.25, 0.5, 0.3]
random_grid = {'n_estimators': n_estimators,
               'max_features': max_features,
               'max_depth': max_depth,
               'learning_rate':learning_rate               
              }
print(random_grid)
gbr_randomcv=RandomizedSearchCV(estimator=gbr_model,param_distributions=random_grid,n_iter=25,cv=5,verbose=2, random_state=100,n_jobs=-1)
gbr_randomcv.fit(x_train,y_train)
gbr_randomcv.best_params_
gbr_randomcv.best_estimator_
#Randomize CV R2,MAE,MSE,RMSE
best_random_grid=gbr_randomcv.best_estimator_
ytrain_rcvpredict=best_random_grid.predict(x_train)
ytest_rcvpredict=best_random_grid.predict(x_test)

print('Randomized CV hyperparameter:-\n')
print('Gradient Boost training data randomizedCV R-squared, R2=%.2f'% best_random_grid.score(x_train,y_train))
print('Gradient Boost test data randomizedCV R-squared, R2=%.2f \n'% best_random_grid.score(x_test,y_test))
print('Gradient Boost training data randomizedCV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_rcvpredict))
print('Gradient Boost test data randomizedCV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_rcvpredict))
print('Gradient Boost training data randomizedCV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_rcvpredict))
print('Gradient Boost test data randomizedCV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_rcvpredict))
print('Gradient Boost training data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_rcvpredict)))
print('Gradient Boost test data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_rcvpredict)))
#Grid CV

from sklearn.model_selection import GridSearchCV
param_grid = {
    'max_depth': [1,4,2,3],
    'max_features': ['auto', 'sqrt','log2'],
    'n_estimators': [20,40,50,100],
    'learning_rate':[0.001, 0.25, 0.5]
                    
}
print(param_grid)
grid_search=GridSearchCV(estimator=gbr_model,param_grid=param_grid,cv=3,n_jobs=-1,verbose=2)
grid_search.fit(x_train,y_train)
grid_search.best_estimator_
#Grid CV R2,MAE,MSE,RMSE
best_grid=grid_search.best_estimator_
ytrain_gcvpredict=best_grid.predict(x_train)
ytest_gcvpredict=best_grid.predict(x_test)

print('Grid CV hyperparameter:-\n')
print('Gradient Boost training data Grid CV R-squared, R2=%.2f'% best_grid.score(x_train,y_train))
print('Gradient Boost test data Grid CV R-squared, R2=%.2f \n'% best_grid.score(x_test,y_test))
print('Gradient Boost training data Grid CV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_gcvpredict))
print('Gradient Boost test data Grid CV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_gcvpredict))
print('Gradient Boost training data Grid CV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_gcvpredict))
print('Gradient Boost test data Grid CV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_gcvpredict))
print('Gradient Boost training data Grid CV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_gcvpredict)))
print('Gradient Boost test data Grid CV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_gcvpredict)))
print('SUMMARY:-\n\nFor our regression type problem applying ensemble technique- Random forest (Bagging) gives us the R squared value which is lesser than Boosting R squared value such as- XG boost, Gradient Boost for default hyperparameter. After using optimization a slight change is noticed for R2,MAE,MSE,RMSE for all following models. From our observation we can conclude Gradient boost with RandomizedCv gives us the best result.')
#xg boost data split
x_train,x_test,y_train,y_test= train_test_split(x, y, test_size=0.25, random_state=500) #VAR
print(x_train.shape,x_test.shape,y_train.shape,y_test.shape)
conda install -c conda-forge xgboost
#implement xgb
#pip install xgboost" paste in anaconda cmd
import xgboost as xgb
xgb_model=xgb.XGBRegressor(objective="reg:squarederror")
value_xgb=xgb_model.fit(x_train,y_train)
ytrain_predict=value_xgb.predict(x_train)
ytest_predict=value_xgb.predict(x_test)
#Default hyperparameter R2,MAE,MSE,RMSE
print('Default Hyper parameter:-\n')
print('XG Boost train data default hyperparameter R-squared, R2=%.2f'%value_xgb.score(x_train,y_train))
print('XG Boost test data default hyperparameter R-squared, R2=%.2f\n'% value_xgb.score(x_test,y_test))
print('XG Boost train data default hyperparameter Mean-Absolute-Error, MAE= %.2f'%mean_absolute_error(y_train,ytrain_predict))
print('XG Boost test data default hyperparameter Mean-Absolute-Error, MAE= %.2f\n'% mean_absolute_error(y_test,ytest_predict))
print('XG Boost train data default hyperparameter Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_predict))
print('XG Boost test data default hyperparameter Mean-Squared-Error, MSE= %.2f\n'% mean_squared_error(y_test,ytest_predict))
print('XG Boost train data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_predict)))
print('XG Boost test data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f\n'% np.sqrt(mean_squared_error(y_test,ytest_predict)))
#Randomize CV
import numpy as np
from sklearn.model_selection import RandomizedSearchCV

n_estimators = [int(x) for x in np.linspace(start = 200, stop = 1000, num = 20)]
max_features = ['auto', 'sqrt','log2']
max_depth = [int(x) for x in np.linspace(10, 100,10)]
learning_rate=[0.001, 0.1, 0.25, 0.5, 0.3]
random_grid = {'n_estimators': n_estimators,
               'max_features': max_features,
               'max_depth': max_depth,
               'learning_rate':learning_rate               
              }
print(random_grid)
xgb_randomcv=RandomizedSearchCV(estimator=xgb_model,param_distributions=random_grid,n_iter=25,cv=5,verbose=2, random_state=100,n_jobs=-1)
xgb_randomcv.fit(x_train,y_train)
xgb_randomcv.best_params_
xgb_randomcv.best_estimator_
#Randomize CV R2,MAE,MSE,RMSE
best_random_grid=xgb_randomcv.best_estimator_
ytrain_rcvpredict=best_random_grid.predict(x_train)
ytest_rcvpredict=best_random_grid.predict(x_test)

print('Randomized CV hyperparameter:-\n')
print('XG Boost training data randomizedCV R-squared, R2=%.2f'% best_random_grid.score(x_train,y_train))
print('XG Boost test data randomizedCV R-squared, R2=%.2f \n'% best_random_grid.score(x_test,y_test))
print('XG Boost training data randomizedCV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_rcvpredict))
print('XG Boost test data randomizedCV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_rcvpredict))
print('XG Boost training data randomizedCV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_rcvpredict))
print('XG Boost test data randomizedCV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_rcvpredict))
print('XG Boost training data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_rcvpredict)))
print('XG Boost test data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_rcvpredict)))
#Grid CV

from sklearn.model_selection import GridSearchCV
param_grid = {
    'max_depth': [1,4,3],
    'max_features': ['auto', 'sqrt','log2'],
    'n_estimators': [20,50,100],
    'learning_rate':[0.001, 0.25, 0.5]
                    
}
print(param_grid)
grid_search=GridSearchCV(estimator=xgb_model,param_grid=param_grid,cv=2,n_jobs=-1,verbose=2)
grid_search.fit(x_train,y_train)
grid_search.best_estimator_
#Grid CV R2,MAE,MSE,RMSE
best_grid=grid_search.best_estimator_
ytrain_gcvpredict=best_grid.predict(x_train)
ytest_gcvpredict=best_grid.predict(x_test)

print('Grid CV hyperparameter:-\n')
print('XG Boost training data Grid CV R-squared, R2=%.2f'% best_grid.score(x_train,y_train))
print('XG Boost test data Grid CV R-squared, R2=%.2f \n'% best_grid.score(x_test,y_test))
print('XG Boost training data Grid CV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_gcvpredict))
print('XG Boostt test data Grid CV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_gcvpredict))
print('XG Boostt training data Grid CV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_gcvpredict))
print('XG Boost test data Grid CV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_gcvpredict))
print('XG Boost training data Grid CV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_gcvpredict)))
print('XG Boost test data Grid CV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_gcvpredict)))
%pip install lime

import lime
from lime import lime_tabular
import xgboost as xgb

explainer = lime_tabular.LimeTabularExplainer(
    training_data=np.array(x_train),
    feature_names=x_train.columns,
    verbose=True, mode='regression'
)


exp = explainer.explain_instance(
    data_row=x_test.iloc[1],
    predict_fn=rf.predict
)

exp.show_in_notebook(show_table=True)
# import xgboost as xgb

exp = explainer.explain_instance(
    data_row=x_test.iloc[2],
    predict_fn=value_xgb.predict,
    num_features=5
)

exp.show_in_notebook(show_table=True)
from sklearn.svm import SVR
model = SVR().fit(x_train,y_train)

ytrain_predict=model.predict(x_train)
ytest_predict=model.predict(x_test)
print('Default Hyper parameter:-\n')
print('SVM training data default hyperparameter R-squared, R2=%.2f'% model.score(x_train,y_train))
print('SVM test data default hyperparameter R-squared, R2=%.2f \n'% model.score(x_test,y_test))
print('SVM training data default hyperparameter Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_predict))
print('SVM test data default hyperparameter Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_predict))
print('SVM training data default hyperparameter Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_predict))
print('SVM test data default hyperparameter Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_predict))
print('SVM training data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_predict)))
print('SVMt test data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_predict)))
import pandas as pd
import numpy as np
from sklearn import preprocessing
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV 
from sklearn.svm import SVR 
from sklearn.metrics import make_scorer, roc_auc_score
from scipy import stats
mdl=SVR()
rand_list = {
              "C": stats.uniform(2, 10),
             "gamma": stats.uniform(0.1, 1)}
rand_search = RandomizedSearchCV(mdl, param_distributions = rand_list, n_iter = 20, n_jobs = 4, cv = 3, random_state = 30) 
rand_search.fit(x, y) 
rand_search.cv_results_
ytrain_predict=rand_search.predict(x_train)
ytest_predict=rand_search.predict(x_test)
print('randomizedCV:-\n')
print('SVM training data randomizedCV R-squared, R2=%.2f'% rand_search.score(x_train,y_train))
print('SVM test data randomizedCV R-squared, R2=%.2f \n'% rand_search.score(x_test,y_test))
print('SVM training data randomizedCV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_predict))
print('SVM test data randomizedCV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_predict))
print('SVM training data randomizedCV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_predict))
print('SVM test data randomizedCV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_predict))
print('SVM training data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_predict)))
print('SVMt test data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_predict)))

grid_list = {"C": np.arange(2, 10, 2),
             "gamma": np.arange(0.1, 1, 0.2)}
 
grid_search = GridSearchCV(mdl, param_grid = grid_list, n_jobs = 4, cv = 3) 
grid_search.fit(x, y) 
grid_search.cv_results_
ytrain_predict=grid_search.predict(x_train)
ytest_predict=grid_search.predict(x_test)
print('GridSearchCV:-\n')
print('SVM training data GridSearchCV R-squared, R2=%.2f'% grid_search.score(x_train,y_train))
print('SVM test data GridSearchCV R-squared, R2=%.2f \n'% grid_search.score(x_test,y_test))
print('SVM training data GridSearchCV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_predict))
print('SVM test data GridSearchCV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_predict))
print('SVM training data GridSearchCV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_predict))
print('SVM test data GridSearchCV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_predict))
print('SVM training data GridSearchCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_predict)))
print('SVMt test data GridSearchCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_predict)))
from sklearn.linear_model import Ridge
model = Ridge().fit(x_train,y_train)
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np
ytrain_predict=model.predict(x_train)
ytest_predict=model.predict(x_test)
print('Default Hyper parameter:-\n')
print('Ridge training data default hyperparameter R-squared, R2=%.2f'% model.score(x_train,y_train))
print('Ridge test data default hyperparameter R-squared, R2=%.2f \n'% model.score(x_test,y_test))
print('Ridge training data default hyperparameter Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_predict))
print('Ridge test data default hyperparameter Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_predict))
print('Ridge training data default hyperparameter Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_predict))
print('Ridge test data default hyperparameter Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_predict))
print('Ridge training data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_predict)))
print('Ridge test data default hyperparameter Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_predict)))
from scipy.stats import loguniform
from pandas import read_csv
from sklearn.linear_model import Ridge
from sklearn.model_selection import RepeatedKFold
from sklearn.model_selection import RandomizedSearchCV

model = Ridge()
# define evaluation
cv = RepeatedKFold(n_splits=10, n_repeats=3, random_state=1)
# define search space
space = dict()
space['solver'] = ['svd', 'cholesky', 'lsqr', 'sag']
space['alpha'] = loguniform(1, 100)
space['fit_intercept'] = [True, False]
space['normalize'] = [True, False]
# define search
search = RandomizedSearchCV(model, space, n_iter=100, n_jobs=-1, cv=cv, random_state=1)
# execute search
result = search.fit(x_train, y_train)
# summarize result
print('Best Score: %s' % result.best_score_)
print('Best Hyperparameters: %s' % result.best_params_)
ytrain_predict=result.predict(x_train)
ytest_predict=result.predict(x_test)
print('randomizedCV:-\n')
print('Ridge training data randomizedCV R-squared, R2=%.2f'% result.score(x_train,y_train))
print('Ridge test data randomizedCV R-squared, R2=%.2f \n'% result.score(x_test,y_test))
print('Ridge training data randomizedCV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_predict))
print('Ridge test data randomizedCV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_predict))
print('Ridge training data randomizedCV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_predict))
print('Ridge test data randomizedCV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_predict))
print('Ridge training data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_predict)))
print('Ridge test data randomizedCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_predict)))
# grid search linear regression model 
from pandas import read_csv
from sklearn.linear_model import Ridge
from sklearn.model_selection import RepeatedKFold
from sklearn.model_selection import GridSearchCV
model = Ridge()
# define evaluation
cv = RepeatedKFold(n_splits=10, n_repeats=3, random_state=1)
# define search space
space = dict()
space['solver'] = ['svd', 'cholesky', 'lsqr', 'sag']
space['alpha'] = [1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1, 10, 100]
space['fit_intercept'] = [True, False]
space['normalize'] = [True, False]
# define search
search = GridSearchCV(model, space, n_jobs=-1, cv=cv)
# execute search
result = search.fit(x_train, y_train)
# summarize result
print('Best Score: %s' % result.best_score_)
print('Best Hyperparameters: %s' % result.best_params_)
ytrain_predict=result.predict(x_train)
ytest_predict=result.predict(x_test)
print('Ridge:-\n')
print('Ridge training data GridSearchCV R-squared, R2=%.2f'% result.score(x_train,y_train))
print('Ridge test data GridSearchCV R-squared, R2=%.2f \n'% result.score(x_test,y_test))
print('Ridge training data GridSearchCV Mean-Absolute-Error, MAE= %.2f'% mean_absolute_error(y_train,ytrain_predict))
print('Ridge test data GridSearchCV Mean-Absolute-Error, MAE= %.2f \n'% mean_absolute_error(y_test,ytest_predict))
print('Ridge training data GridSearchCV Mean-Squared-Error, MSE= %.2f'% mean_squared_error(y_train,ytrain_predict))
print('Ridge test data GridSearchCV Mean-Squared-Error, MSE= %.2f \n'% mean_squared_error(y_test,ytest_predict))
print('Ridge training data GridSearchCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_train,ytrain_predict)))
print('Ridge test data GridSearchCV Root-Mean-Squared-Error, RMSE= %.2f'% np.sqrt(mean_squared_error(y_test,ytest_predict)))

declare module 'react-native-vector-icons/Feather' {
  import { Component } from 'react';
  import { TextStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | TextStyle[];
  }

  export default class Icon extends Component<IconProps> {}
}


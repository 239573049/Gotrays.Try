using Blazor.Code.Shared.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Blazor.Code.Client;

public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();

        blazorWebView.RootComponents.RegisterAsCustomElement<DynamicRendering>("render-razor");
        blazorWebView.RootComponents.RegisterAsCustomElement<GlobalUsing>("global-using");
    }
}
